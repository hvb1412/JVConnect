import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Mail, Lock, User, Upload, ShieldCheck } from "lucide-react";
import { registerUser, verifyEmail, resendOtp } from "../lib/authApi";
import { uploadImageByUrl } from "../lib/uploadApi";

export function GuestRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [registerError, setRegisterError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0 && step === 2) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  const handleSelectAvatar = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("ファイルサイズは5MB以内にしてください。");
      return;
    }

    setAvatarError("");
    setIsUploading(true);

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
        reader.readAsDataURL(file);
      });

      const result = await uploadImageByUrl(dataUrl);
      setAvatarUrl(result.secure_url);
      setAvatarPreview(result.secure_url);
    } catch (error: any) {
      setAvatarError(error?.message || "アップロードに失敗しました。");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setRegisterError("必須項目を入力してください。");
      return;
    }

    if (password !== confirmPassword) {
      setRegisterError("パスワード確認が一致しません。");
      return;
    }

    try {
      setIsLoading(true);
      setRegisterError("");
      await registerUser(name, email, password, avatarUrl);
      setStep(2);
      setResendTimer(60); // 60 seconds countdown
    } catch (error: any) {
      setRegisterError(error.message || "登録に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setRegisterError("OTPを入力してください。");
      return;
    }

    try {
      setIsLoading(true);
      setRegisterError("");
      const result = await verifyEmail(email, otp);
      
      // Auto login after verification
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.user.id);
      localStorage.setItem("role", result.role);
      
      if (result.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/user/home");
      }
    } catch (error: any) {
      setRegisterError(error.message || "認証に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setRegisterError("");
      await resendOtp(email);
      setResendTimer(60);
    } catch (error: any) {
      setRegisterError(error.message || "再送信に失敗しました。");
    }
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
                <CardTitle className="text-2xl">
                  {step === 1 ? "新規登録" : "メールアドレスの確認"}
                </CardTitle>
                <CardDescription>
                  {step === 1 
                    ? "アカウントを作成してください" 
                    : "入力したメールアドレスに送信された6桁の確認コード(OTP)を入力してください。"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {step === 1 ? (
                  <>
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
                      <input
                        ref={fileInputRef}
                        id="avatar"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={handleSelectAvatar}
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors"
                      >
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Avatar preview"
                            className="mx-auto h-36 w-36 rounded-full object-cover"
                          />
                        ) : (
                          <>
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <p className="mt-2 text-sm text-gray-600">
                              {isUploading ? "アップロード中..." : "クリックしてアップロード"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              PNG, JPG, GIF (最大 5MB)
                            </p>
                          </>
                        )}
                      </button>
                      {avatarError && <p className="text-xs text-red-600">{avatarError}</p>}
                    </div>

                    {registerError && <p className="text-sm text-red-600">{registerError}</p>}

                    <div className="space-y-3 pt-2">
                      <Button className="w-full" size="lg" onClick={handleRegister} disabled={isLoading || isUploading}>
                        {isLoading ? "登録中..." : "登録して認証コードを受け取る"}
                      </Button>
                      <Button asChild variant="outline" className="w-full" size="lg" disabled={isLoading}>
                        <Link to="/guest/login">ログインへ</Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  // OTP VERIFICATION STEP
                  <div className="space-y-6">
                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                      <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800 font-medium">確認コードを送信しました</p>
                        <p className="text-xs text-blue-600 mt-1">{email} の受信箱をご確認ください。</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="otp">確認コード (OTP)</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        maxLength={6}
                        className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/[^0-9]/g, ''));
                          if (registerError) setRegisterError("");
                        }}
                      />
                    </div>

                    {registerError && <p className="text-sm text-red-600 text-center">{registerError}</p>}

                    <Button className="w-full h-12 text-lg" onClick={handleVerifyOtp} disabled={isLoading || otp.length !== 6}>
                      {isLoading ? "認証中..." : "認証してログイン"}
                    </Button>

                    <div className="text-center mt-4">
                      {resendTimer > 0 ? (
                        <p className="text-sm text-gray-500">
                          コードを再送信するには {resendTimer} 秒お待ちください
                        </p>
                      ) : (
                        <button 
                          onClick={handleResendOtp}
                          className="text-sm text-blue-600 hover:underline font-medium"
                        >
                          コードを再送信する
                        </button>
                      )}
                    </div>
                    
                    <div className="text-center pt-2">
                      <button 
                        onClick={() => setStep(1)}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        メールアドレスを変更する
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
