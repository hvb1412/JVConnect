import { beforeAll, afterAll, beforeEach, describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import jwt from "jsonwebtoken";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Event from "../src/models/Event.js";
import Report from "../src/models/Report.js";

const JWT_SECRET = process.env.JWT_SECRET || "jvconnect_secret_key_123456";

let mongoServer;

const signToken = (user) =>
  jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

const createUser = async (overrides = {}) => {
  return User.create({
    name: "Test User",
    email: `user-${Math.random().toString(16).slice(2)}@example.com`,
    password: "Password123!",
    isVerified: true,
    ...overrides,
  });
};

const createEvent = async (organizerId) => {
  return Event.create({
    title: "Test Event",
    eventDate: new Date(),
    startTime: "10:00",
    endTime: "11:00",
    location: "Tokyo",
    organizer: organizerId,
    detail: "Details",
    imageURL: "",
    status: "active",
  });
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}, 120000);

beforeEach(async () => {
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Report.deleteMany({}),
  ]);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 120000);

describe("Report submission", () => {
  it("creates a user report", async () => {
    const reporter = await createUser();
    const targetUser = await createUser();
    const token = signToken(reporter);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reportType: "Spam",
        reason: "Harassment",
        detail: "Repeated spam",
        userId: targetUser._id.toString(),
      });

    expect(res.status).toBe(201);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.reportId).toBeTruthy();

    const saved = await Report.findById(res.body.data.reportId);
    expect(saved).toBeTruthy();
    expect(saved?.user?.toString()).toBe(targetUser._id.toString());
    expect(saved?.decision).toBe("pending");
  });

  it("rejects missing reason", async () => {
    const reporter = await createUser();
    const targetUser = await createUser();
    const token = signToken(reporter);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reportType: "Spam",
        userId: targetUser._id.toString(),
      });

    expect(res.status).toBe(400);
  });

  it("rejects reporting self", async () => {
    const reporter = await createUser();
    const token = signToken(reporter);

    const res = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send({
        reportType: "Spam",
        reason: "Self report",
        userId: reporter._id.toString(),
      });

    expect(res.status).toBe(400);
  });

  it("rejects duplicate pending report", async () => {
    const reporter = await createUser();
    const targetUser = await createUser();
    const token = signToken(reporter);

    const payload = {
      reportType: "Spam",
      reason: "Spam",
      userId: targetUser._id.toString(),
    };

    const first = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    const second = await request(app)
      .post("/api/reports")
      .set("Authorization", `Bearer ${token}`)
      .send(payload);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });
});

describe("Report moderation", () => {
  it("filters reports by status", async () => {
    const admin = await createUser({ role: "admin" });
    const reporter = await createUser();
    const targetUser = await createUser();

    const report = await Report.create({
      reporter: reporter._id,
      reportType: "Spam",
      reason: "Spam",
      detail: "",
      status: "pending",
      decision: "pending",
      user: targetUser._id,
    });

    const adminToken = signToken(admin);

    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ status: "pending" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.length).toBe(1);
    expect(res.body.data[0]._id).toBe(report._id.toString());
  });

  it("rejects invalid status filter", async () => {
    const admin = await createUser({ role: "admin" });
    const adminToken = signToken(admin);

    const res = await request(app)
      .get("/api/admin/reports")
      .set("Authorization", `Bearer ${adminToken}`)
      .query({ status: "unknown" });

    expect(res.status).toBe(400);
  });

  it("approves report and bans user", async () => {
    const admin = await createUser({ role: "admin" });
    const reporter = await createUser();
    const targetUser = await createUser();

    const report = await Report.create({
      reporter: reporter._id,
      reportType: "Abuse",
      reason: "Abusive content",
      detail: "",
      status: "pending",
      decision: "pending",
      user: targetUser._id,
    });

    const adminToken = signToken(admin);

    const res = await request(app)
      .post(`/api/admin/reports/${report._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ banDays: 3, reason: "Violation" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.decision).toBe("approved");

    const updatedUser = await User.findById(targetUser._id);
    expect(updatedUser?.isRestricted).toBe(true);
    expect(updatedUser?.restrictedUntil).toBeTruthy();
  });

  it("approves event report and deactivates event", async () => {
    const admin = await createUser({ role: "admin" });
    const reporter = await createUser();
    const organizer = await createUser();
    const event = await createEvent(organizer._id);

    const report = await Report.create({
      reporter: reporter._id,
      reportType: "EventFake",
      reason: "Fake event",
      detail: "",
      status: "pending",
      decision: "pending",
      event: event._id,
    });

    const adminToken = signToken(admin);

    const res = await request(app)
      .post(`/api/admin/reports/${report._id}/approve`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ banDays: 0, reason: "Policy" });

    expect(res.status).toBe(200);
    const updatedEvent = await Event.findById(event._id);
    expect(updatedEvent?.status).toBe("inactive");
  });

  it("rejects report with reason", async () => {
    const admin = await createUser({ role: "admin" });
    const reporter = await createUser();
    const targetUser = await createUser();

    const report = await Report.create({
      reporter: reporter._id,
      reportType: "Spam",
      reason: "Spam",
      detail: "",
      status: "pending",
      decision: "pending",
      user: targetUser._id,
    });

    const adminToken = signToken(admin);

    const res = await request(app)
      .post(`/api/admin/reports/${report._id}/reject`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Not valid" });

    expect(res.status).toBe(200);
    expect(res.body?.data?.decision).toBe("rejected");
    expect(res.body?.data?.decisionReason).toBe("Not valid");
  });
});
