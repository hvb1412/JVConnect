import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Logo } from "../components/Logo";
import { LanguageToggle } from "../components/LanguageToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Mail, Lock } from "lucide-react";
import { loginUser } from "../lib/authApi";

type ForgotStep = "email" | "guide" | "otp";

export function GuestLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [code, setCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openForgot = params.get("forgot") === "1";
    const queryEmail = params.get("email") ?? "";
    const stepParam = params.get("step");
    const step = stepParam === "guide" || stepParam === "otp" ? stepParam : "email";

    if (queryEmail) {
      setResetEmail(queryEmail);
    }
    setForgotStep(step);
    setForgotOpen(openForgot);
  }, [location.search]);

  const openForgotStep = (step: ForgotStep, emailValue: string) => {
    const safeEmail = emailValue.trim();
    setForgotOpen(true);
    setForgotStep(step);
    navigate(
      `/guest/login?forgot=1&step=${step}${safeEmail ? `&email=${encodeURIComponent(safeEmail)}` : ""}`,
      { replace: true },
    );
  };

  const closeForgotDialog = () => {
    setForgotOpen(false);
    setForgotStep("email");
    setCode("");
    navigate("/guest/login", { replace: true });
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setLoginError("");
      const result = await loginUser(email, password);
      
      // Store token and userId
      localStorage.setItem("token", result.token);
      localStorage.setItem("userId", result.user.id);
      
      navigate("/user/home");
    } catch (error: any) {
      setLoginError(error.message || "メールアドレスまたはパスワードが正しくありません。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center">
          <img
            src="https://images.unsplash.com/photo-1759866221633-4d03836def4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWxjb21lJTIwaWxsdXN0cmF0aW9uJTIwbW9kZXJufGVufDF8fHx8MTc3NDk4ODEyN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
            alt="Welcome"
            className="w-full h-auto rounded-2xl shadow-lg"
          />
          <h2 className="mt-6 text-2xl font-semibold text-center text-gray-800">
            JV Connectへようこそ
          </h2>
          <p className="mt-2 text-gray-600 text-center">
            ビジネスパートナーとつながり、成長しましょう
          </p>
        </div>

        {/* Right side - Login form */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-8">
              <Logo />
              <LanguageToggle />
            </div>

            <Card className="w-full shadow-xl">
              <CardHeader className="space-y-2">
                <CardTitle className="text-2xl">ログイン</CardTitle>
                <CardDescription>
                  アカウントにログインしてください
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
                        if (loginError) setLoginError("");
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
                        if (loginError) setLoginError("");
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={() => {
                      setResetEmail(email);
                      openForgotStep("email", email);
                    }}
                  >
                    パスワードを忘れた場合
                  </button>
                </div>

                {loginError && <p className="text-sm text-red-600">{loginError}</p>}

                <div className="space-y-3">
                  <Button className="w-full" size="lg" onClick={handleLogin} disabled={isLoading}>
                    {isLoading ? "ログイン中..." : "ログイン"}
                  </Button>
                  <Button asChild variant="outline" className="w-full" size="lg" disabled={isLoading}>
                    <Link to="/guest/register">新規登録へ</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog
        open={forgotOpen}
        onOpenChange={(open) => {
          if (!open) closeForgotDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {forgotStep === "email" && "パスワードをお忘れですか？"}
              {forgotStep === "guide" && "認証コードを送信しました"}
              {forgotStep === "otp" && "認証コードを入力"}
            </DialogTitle>
            {forgotStep === "guide" && (
              <DialogDescription>
                <span className="font-medium text-gray-900">{resetEmail || "your.email@example.com"}</span>{" "}
                に6桁の認証コードを送信しました。
              </DialogDescription>
            )}
            {forgotStep === "otp" && (
              <DialogDescription>
                <span className="font-medium text-gray-900">{resetEmail || "your.email@example.com"}</span>{" "}
                に送信された6桁コードを入力してください。
              </DialogDescription>
            )}
          </DialogHeader>
          {forgotStep === "email" && (
            <>
              <p className="text-sm text-gray-600">
                登録したメールアドレスを入力してください。再設定用のリンクをお送りします。
              </p>
              <div className="space-y-2 py-2">
                <Label htmlFor="reset-email">メールアドレス</Label>
                <Input
                  id="reset-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button disabled={!resetEmail.trim()} onClick={() => openForgotStep("guide", resetEmail)}>
                  送信
                </Button>
                <Button variant="outline" onClick={closeForgotDialog}>
                  キャンセル
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotStep === "guide" && (
            <>
              <div className="space-y-5">
                <div className="rounded-lg border bg-blue-50 p-4 text-sm text-gray-700">
                  メールが届かない場合は、迷惑メールフォルダも確認してください。
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">次に行うこと</h3>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
                    <li>受信したメールを開いて6桁の認証コードを確認してください。</li>
                    <li>「コード入力へ」を押して認証コードを入力してください。</li>
                    <li>認証後、新しいパスワードを設定してください。</li>
                    <li>再度ログイン画面に戻ってログインしてください。</li>
                  </ol>
                </div>
              </div>
              <DialogFooter className="sm:justify-start gap-2">
                <Button onClick={() => openForgotStep("otp", resetEmail)}>コード入力へ</Button>
                <Button variant="outline" onClick={() => openForgotStep("email", resetEmail)}>
                  戻る
                </Button>
                <Button variant="outline" onClick={() => openForgotStep("guide", resetEmail)}>
                  メールを再送
                </Button>
              </DialogFooter>
            </>
          )}

          {forgotStep === "otp" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">認証コード</Label>
                <Input
                  id="otp"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="123456"
                />
              </div>
              <DialogFooter className="sm:justify-start gap-2">
                <Button
                  disabled={code.length !== 6}
                  onClick={() => navigate(`/guest/reset-password?email=${encodeURIComponent(resetEmail.trim())}`)}
                >
                  確認
                </Button>
                <Button variant="outline" onClick={() => openForgotStep("guide", resetEmail)}>
                  戻る
                </Button>
                <Button variant="ghost" onClick={closeForgotDialog}>
                  キャンセル
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
