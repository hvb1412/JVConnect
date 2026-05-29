import { Link } from "react-router";
import { Logo } from "../components/Logo";
import { HeaderActions } from "../components/HeaderActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Check, Menu } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { useTranslation } from "../lib/i18n";

const plans = [
  {
    id: "free",
    name: "無料プラン",
    price: "¥0",
    period: "月",
    description: "基本的な機能を試す",
    features: [
      "基本的なプロフィール",
      "月5件のマッチング",
      "イベント閲覧",
      "基本的なチャット機能",
    ],
    current: true,
  },
  {
    id: "standard",
    name: "スタンダードプラン",
    price: "¥2,980",
    period: "月",
    description: "より多くの機能を利用",
    popular: true,
    features: [
      "拡張プロフィール",
      "無制限のマッチング",
      "すべてのイベントに参加",
      "優先チャット機能",
      "詳細な検索フィルター",
      "イベント割引",
    ],
    current: false,
  },
  {
    id: "premium",
    name: "プレミアムプラン",
    price: "¥5,980",
    period: "月",
    description: "すべての機能を解除",
    features: [
      "すべてのスタンダード機能",
      "プロフィール強調表示",
      "AI推薦マッチング",
      "無制限のイベント作成",
      "専属サポート",
      "分析レポート",
      "広告非表示",
    ],
    current: false,
  },
];

export function UserSubscription() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/user/home" className="text-gray-600 hover:text-gray-900">{t("nav_home")}</Link>
              <Link to="/user/search" className="text-gray-600 hover:text-gray-900">{t("nav_search")}</Link>
              <Link to="/user/events" className="text-gray-600 hover:text-gray-900">{t("nav_events")}</Link>
              <Link to="/user/mypage" className="text-gray-600 hover:text-gray-900">{t("nav_mypage")}</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <HeaderActions />
            <Button size="icon" variant="ghost">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("plans_title")}</h1>
          <p className="text-xl text-gray-600">{t("choose_plan_subtitle")}</p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular
                  ? "ring-2 ring-blue-500 shadow-xl"
                  : plan.current
                  ? "ring-2 ring-green-500"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-500">{t("popular")}</Badge>
                </div>
              )}
              {plan.current && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-green-500">{t("current_plan")}</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                {plan.current ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t("current_plan")}
                  </Button>
                ) : (
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                    {t("purchase")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{t("faq_title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{t("faq_q_change_plan")}</h3>
              <p className="text-gray-600 text-sm">{t("faq_a_change_plan")}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t("faq_q_payment_methods")}</h3>
              <p className="text-gray-600 text-sm">{t("faq_a_payment_methods")}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t("faq_q_cancel")}</h3>
              <p className="text-gray-600 text-sm">{t("faq_a_cancel")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Button asChild variant="outline">
            <Link to="/user/mypage">{t("back_to_mypage")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
