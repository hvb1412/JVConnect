import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Mail, Lock, User, Upload } from "lucide-react";
import { registerAccount } from "../lib/accountStore";

export function GuestRegister() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerError, setRegisterError] = useState("");

  const handleRegister = () => {
    if (!name.trim() || !email.trim() || !password) {
      setRegisterError("必須項目を入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError("パスワード確認が一致しません。");
      return;
    }

    const result = registerAccount({ name, email, password });
    if (!result.ok && result.reason === "duplicate_email") {
      setRegisterError("このメールアドレスは既に登録されています。");
      return;
    }

    setRegisterError("");
    navigate("/user/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1642132652859-3ef5a1048fd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsYWJvcmF0aW9uJTIwdGVhbXdvcmslMjBpbGx1c3RyYXRpb258ZW58MXx8fHwxNzc0OTg4MTI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Join us"
            className="w-full h-auto rounded-2xl shadow-lg"
          />
          <h2 className="mt-6 text-2xl font-semibold text-center text-gray-800">
            新しい出会いが待っています
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            今すぐ登録して、世界中のビジネスパートナーとつながりましょう
          </p>
        </div>

        {/* Right side - Register form */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <LanguageToggle />
            </div>

            <Card className="w-full shadow-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">新規登録</CardTitle>
                <CardDescription>
                  アカウントを作成してください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">名前</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="山田太郎"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (registerError) setRegisterError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">メールアドレス</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (registerError) setRegisterError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">パスワード</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (registerError) setRegisterError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">パスワード確認</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (registerError) setRegisterError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">プロフィール画像</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      クリックしてアップロード
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG, GIF (最大 5MB)
                    </p>
                  </div>
                </div>

                {registerError && <p className="text-sm text-red-600">{registerError}</p>}

                <div className="space-y-3 pt-2">
                  <Button className="w-full" size="lg" onClick={handleRegister}>
                    登録
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg">
                    <Link to="/guest/login">ログインへ</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
