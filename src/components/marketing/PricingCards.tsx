import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, ShieldCheck, Store, Users, ArrowRight } from "lucide-react";
import { useAppLanguage } from "@/i18n/useAppLanguage";
import type { AppLanguage } from "@/lib/appLanguage";
import { getAnnualPriceRwf, getMonthlyPriceRwf } from "@/lib/entitlements";
import { formatRwf, trialLengthDays } from "@/lib/plans";
import { isNativeApp } from "@/lib/platform";
import { accountHost } from "@/lib/site";

export function PricingCards() {
  const lang = useAppLanguage();
  const [yearly, setYearly] = useState(false);
  const native = isNativeApp();

  const period = yearly ? "annual" : "monthly";
  const days = trialLengthDays();

  const normalMonthly = getMonthlyPriceRwf("normal");
  const normalAnnual = getAnnualPriceRwf("normal");
  const normalPrice = yearly ? normalAnnual : normalMonthly;

  const proMonthly = getMonthlyPriceRwf("pro");
  const proAnnual = getAnnualPriceRwf("pro");
  const proPrice = yearly ? proAnnual : proMonthly;

  const msg = (map: { en: string; rw: string; zh: string; ar: string }) => {
    return map[lang as keyof typeof map] || map.rw || map.en;
  };

  if (native) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700 space-y-2 max-w-md mx-auto text-center">
        <p className="font-semibold text-slate-900">
          {msg({
            rw: "Kwishyura no gucunga ifatabuguzi",
            en: "Subscription Management",
            zh: "订阅管理",
            ar: "إدارة الاشتراكات",
          })}
        </p>
        <p className="text-slate-600 text-xs leading-relaxed">
          {msg({
            rw: `Gucunga ifatabuguzi bikorwa binyuze ku rubuga rwa interineti muri browser yawe kuri ${accountHost()}.`,
            en: `Subscriptions are managed securely via your web browser at ${accountHost()}.`,
            zh: `您可以通过网页浏览器在 ${accountHost()} 安全管理订阅。`,
            ar: `تتم إدارة الاشتراكات بأمان عبر متصفح الويب الخاص بك على ${accountHost()}.`,
          })}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 text-slate-900 font-sans">
      {/* Monthly / Yearly Billing Selector */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div
          className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1"
          role="group"
          aria-label={msg({
            rw: "Guhitamo igihe cy'ubwishyu",
            en: "Billing cadence",
            zh: "计费周期",
            ar: "دورة الفوترة",
          })}
        >
          <button
            type="button"
            onClick={() => setYearly(false)}
            className={`min-h-10 px-4 rounded-lg text-xs font-semibold transition-all ${
              !yearly
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-pressed={!yearly}
          >
            {msg({
              rw: "Kuri buri kwezi (Monthly)",
              en: "Monthly billing",
              zh: "按月计费",
              ar: "الدفع الشهري",
            })}
          </button>
          <button
            type="button"
            onClick={() => setYearly(true)}
            className={`min-h-10 px-4 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
              yearly
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            aria-pressed={yearly}
          >
            <span>
              {msg({
                rw: "Ku mwaka (Yearly)",
                en: "Yearly billing",
                zh: "按年计费",
                ar: "الدفع السنوي",
              })}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {msg({
                rw: "Iminsi 60 y'ubuntu",
                en: "Save 2 months",
                zh: "立省2个月",
                ar: "وفر شهرين مجاناً",
              })}
            </span>
          </button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          {yearly
            ? msg({
                rw: "Ifatabuguzi ry'umwaka ringana n'amezi 10 — amezi 2 ni ubuntu.",
                en: "An annual subscription costs 10 monthly payments — 2 months free.",
                zh: "按年订阅仅需支付10个月费用 — 享2个月免费。",
                ar: "تكلفة الاشتراك السنوي تعادل 10 أشهر فقط — شهران مجاناً.",
              })
            : msg({
                rw: "Kwishyura buri minsi 30 binyuze kuri MTN Mobile Money.",
                en: "The website asks for the payment on MTN MoMo. Cash, Airtel, and bank are for sales at the counter.",
                zh: "网站订阅通过 MTN MoMo 支付。现金、Airtel 和银行适用于柜台销售。",
                ar: "يتم سداد اشتراك الموقع عبر MTN MoMo. الدفع النقدي وAirtel والبنكي مخصص لمبيعات الصندوق.",
              })}
        </p>
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* ── CARD 1: TRIAL ── */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                {msg({
                  rw: "Igerageza (Trial)",
                  en: "Free Trial",
                  zh: "免费试用",
                  ar: "تجربة مجانية",
                })}
              </span>
            </div>

            <div>
              <div className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums">
                0 RWF
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {msg({
                  rw: `Iminsi ${days} yose ku buntu`,
                  en: `${days} days of complete access`,
                  zh: `完全免费畅享 ${days} 天`,
                  ar: `${days} أيام من الوصول الكامل مجاناً`,
                })}
              </p>
            </div>

            {/* Shop & Staff Limits */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center gap-2 font-medium">
                <Store size={14} className="text-slate-600 shrink-0" />
                <span>
                  {msg({
                    rw: "Iduka 1 (Single shop)",
                    en: "1 shop location",
                    zh: "1 家注册店铺",
                    ar: "متجر واحد مسجل",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Users size={14} className="text-slate-600 shrink-0" />
                <span>
                  {msg({
                    rw: "Nyir'iduka + umukozi 1",
                    en: "Owner + 1 cashier PIN",
                    zh: "店主 + 1 位收银员 PIN",
                    ar: "مالك المتجر + 1 كاشير عبر PIN",
                  })}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kugurisha ku meza (POS register)",
                    en: "Full counter POS register",
                    zh: "完整柜台收银机功能",
                    ar: "صندوق محاسبة ونقاط بيع كامل",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Igitabo cy'amadeni (Ideni) & WhatsApp",
                    en: "Customer debt book (Ideni) & WhatsApp",
                    zh: "客户赊账本 (Ideni) 与 WhatsApp 提醒",
                    ar: "دفتر ديون العملاء (Ideni) وتذكيرات واتساب",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kugurisha interineti ihise",
                    en: "Sells offline, then syncs",
                    zh: "支持断网离线收银，联网后自动同步",
                    ar: "يعمل بدون إنترنت ثم يتزامن تلقائياً",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Resi za thermal (58/80mm) na PDF",
                    en: "Thermal 58/80mm & PDF receipts",
                    zh: "热敏小票 (58/80mm) 与 PDF 收据",
                    ar: "إيصالات حرارية 58/80 مم وPDF",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Ibikoresho bya Pro byose mu minsi 7",
                    en: "Includes Pro features during trial",
                    zh: "试用期内享受所有 Pro 高级功能",
                    ar: "يشمل جميع ميزات Pro خلال التجربة",
                  })}
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              to="/signup"
              className="w-full min-h-11 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>
                {msg({
                  rw: "Tangira iminsi 7 ku buntu",
                  en: "Start 7-Day Free Trial",
                  zh: "立即开启7天免费试用",
                  ar: "ابدأ تجربة مجانية لمدة 7 أيام",
                })}
              </span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>

        {/* ── CARD 2: NORMAL PLAN ── */}
        <article className="rounded-2xl border border-slate-200 bg-white p-6 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {msg({
                  rw: "Isanzwe (Normal)",
                  en: "Normal Plan",
                  zh: "标准版 (Normal)",
                  ar: "الخطة العادية",
                })}
              </span>
            </div>

            <div>
              <div className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums">
                {formatRwf(normalPrice)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {yearly
                  ? msg({
                      rw: "Ku mwaka wose (Ahwanye n'amezi 10)",
                      en: "Per year (Costs 10 monthly payments)",
                      zh: "按年计费（享10个月优惠价）",
                      ar: "سنوياً (تكلفة 10 أشهر فقط)",
                    })
                  : msg({
                      rw: "Buri kwezi (Billed monthly)",
                      en: "Per month",
                      zh: "按月计费",
                      ar: "شهرياً",
                    })}
              </p>
            </div>

            {/* Shop & Staff Limits */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
              <div className="flex items-center gap-2 font-medium">
                <Store size={14} className="text-slate-600 shrink-0" />
                <span>
                  {msg({
                    rw: "Iduka 1 (1 registered shop)",
                    en: "1 shop location",
                    zh: "1 家注册店铺",
                    ar: "متجر واحد مسجل",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Users size={14} className="text-slate-600 shrink-0" />
                <span>
                  {msg({
                    rw: "Nyir'iduka + umukozi 1 ugurisha",
                    en: "Owner + 1 cashier PIN",
                    zh: "店主 + 1 位收银员 PIN",
                    ar: "مالك المتجر + 1 كاشير عبر PIN",
                  })}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kugurisha, kwakira amafaranga & kashi",
                    en: "Full counter POS register",
                    zh: "完整柜台收银与结账",
                    ar: "صندوق كاشير ونقاط بيع متكاملة",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Ubwishyu bwa MTN MoMo & Airtel Money",
                    en: "Cash, MTN MoMo & Airtel split payments",
                    zh: "支持现金、MTN MoMo 和 Airtel 组合支付",
                    ar: "دفع نقدي وتجزئة عبر MTN MoMo وAirtel",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Gukumira kwiba kuri ref za MoMo",
                    en: "Duplicate MoMo reference check",
                    zh: "防止重复使用 MoMo 交易号防作弊",
                    ar: "التحقق من أرقام مراجع MoMo لمنع الاحتيال",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Amadeni y'abakiliya & kwibutsa kuri WhatsApp",
                    en: "Customer credit (Ideni) & WhatsApp",
                    zh: "客户赊账 (Ideni) 与 WhatsApp 自动催收",
                    ar: "إدارة ديون العملاء (Ideni) مع واتساب",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Gucunga sitoki n'imiburo y'ibiri gushira",
                    en: "Stock tracking & low-stock alerts",
                    zh: "库存监控与缺货自动预警",
                    ar: "تتبع المخزون وتنبيهات نفاد البضائع",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kugurisha interineti ihise",
                    en: "Sells offline, then syncs",
                    zh: "支持断网离线收银，联网后自动同步",
                    ar: "يعمل بدون إنترنت ثم يتزامن تلقائياً",
                  })}
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              to={`/subscribe?product=normal&interval=${period}`}
              className="w-full min-h-11 rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>
                {msg({
                  rw: "Hitamo Isanzwe (Normal)",
                  en: "Choose Normal",
                  zh: "选择标准版",
                  ar: "اختر الخطة العادية",
                })}
              </span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>

        {/* ── CARD 3: PRO PLAN ── */}
        <article className="rounded-2xl border-2 border-[#0B3FCC] bg-white p-6 flex flex-col justify-between shadow-md relative">
          <div className="absolute -top-3 right-6 bg-[#0B3FCC] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
            {msg({
              rw: "Amahitamo ya benshi",
              en: "Most Popular",
              zh: "最受欢迎",
              ar: "الأكثر طلباً",
            })}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B3FCC] bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                Sella Pro
              </span>
            </div>

            <div>
              <div className="text-3xl font-mono font-extrabold text-slate-900 tabular-nums">
                {formatRwf(proPrice)}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {yearly
                  ? msg({
                      rw: "Ku mwaka wose (Ahwanye n'amezi 10)",
                      en: "Per year (Costs 10 monthly payments)",
                      zh: "按年计费（享10个月优惠价）",
                      ar: "سنوياً (تكلفة 10 أشهر فقط)",
                    })
                  : msg({
                      rw: "Buri kwezi (Billed monthly)",
                      en: "Per month",
                      zh: "按月计费",
                      ar: "شهرياً",
                    })}
              </p>
            </div>

            {/* Shop & Staff Limits */}
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-1.5 text-slate-800">
              <div className="flex items-center gap-2 font-medium">
                <Store size={14} className="text-[#0B3FCC] shrink-0" />
                <span>
                  {msg({
                    rw: "Amaduka 3 (Multi-shop management)",
                    en: "Up to 3 shop locations",
                    zh: "最多管理 3 家店铺",
                    ar: "حتى 3 فروع ومتاجر",
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 font-medium">
                <Users size={14} className="text-[#0B3FCC] shrink-0" />
                <span>
                  {msg({
                    rw: "Abakozi 5 bose hamwe kuri PIN",
                    en: "Up to 5 cashier PIN accounts",
                    zh: "最多 5 位收银员专属 PIN",
                    ar: "حتى 5 حسابات كاشير عبر PIN",
                  })}
                </span>
              </div>
            </div>

            {/* Features */}
            <ul className="space-y-2 text-xs text-slate-700 pt-1">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-900">
                  {msg({
                    rw: "Ibyiza byose byo muri Isanzwe (Normal)",
                    en: "Everything in Normal plan",
                    zh: "包含标准版所有功能",
                    ar: "جميع ميزات الخطة العادية",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Guhuza amaduka menshi n'ahantu hatandukanye",
                    en: "Multi-branch consolidated reporting",
                    zh: "多门店汇总分析与实时报表",
                    ar: "تقارير موحدة لعدة فروع",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kwinjiza ibicuruzwa byinshi muri Excel (Bulk)",
                    en: "Bulk Excel item import & price sync",
                    zh: "支持 Excel 批量导入商品与改价",
                    ar: "استيراد المخزون مجمعاً عبر Excel",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Sella AI Assistant (Inama z'ubucuruzi)",
                    en: "Sella AI shop advisor",
                    zh: "Sella AI 智能店铺经营顾问",
                    ar: "مساعد Sella الذكي لتقديم المشورة",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Kubika kopi y'imari (Automated cloud backup)",
                    en: "Automated daily cloud backups",
                    zh: "每日云端自动安全备份",
                    ar: "نسخ احتياطي سحابي تلقائي يومياً",
                  })}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  {msg({
                    rw: "Ubufasha bwihuse kuri terefone na WhatsApp",
                    en: "Priority WhatsApp & phone support",
                    zh: "专属 WhatsApp 及电话 VIP 客服",
                    ar: "دعم فوري ومباشر عبر واتساب والهاتف",
                  })}
                </span>
              </li>
            </ul>
          </div>

          <div className="pt-6">
            <Link
              to={`/subscribe?product=pro&interval=${period}`}
              className="w-full min-h-11 rounded-xl bg-[#0B3FCC] hover:bg-[#0932A3] text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>
                {msg({
                  rw: "Hitamo Sella Pro",
                  en: "Choose Sella Pro",
                  zh: "升级 Sella Pro",
                  ar: "اختر Sella Pro",
                })}
              </span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </article>
      </div>

      {/* Assurance Footer Banner */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <span>
            {msg({
              rw: "Ibihano byose byishyurwa muri RWF yuzuye. Nta mafaranga y'ihishwa.",
              en: "All amounts in whole Rwandan Francs (RWF). No hidden currency conversion fees.",
              zh: "所有费用均以卢旺达法郎 (RWF) 结算，无任何隐藏汇率手续费。",
              ar: "جميع المبالغ بالفرنك الرواندي (RWF). لا توجد رسوم تحويل خفية.",
            })}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          KUBANA FRIEND TECHNOLOGIES · Kigali
        </div>
      </div>
    </div>
  );
}
