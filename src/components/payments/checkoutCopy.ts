import type { AppLanguage } from "@/lib/appLanguage";

export interface CheckoutCopyEntry {
  en: string;
  rw: string;
  zh: string;
  ar: string;
  fr?: string;
  sw?: string;
}

export const CHECKOUT_COPY: Record<string, CheckoutCopyEntry> = {
  express_tag: {
    en: "Sella MomoPay Express • Instant Activation",
    rw: "Sella MomoPay Express • Gufungura Ako Kanya",
    zh: "Sella MomoPay 快捷支付 • 即刻开通",
    ar: "دفع Sella MomoPay السريع • تفعيل فوري",
  },
  pay_title: {
    en: "Pay with MomoPay",
    rw: "Kwishyura na MomoPay",
    zh: "使用 MomoPay 支付",
    ar: "الدفع عبر MomoPay",
  },
  monthly: {
    en: "Monthly",
    rw: "Buri kwezi",
    zh: "按月",
    ar: "شهرياً",
  },
  yearly_tag: {
    en: "Yearly (-2 mo)",
    rw: "Ku mwaka (-2 mo)",
    zh: "按年 (立省2个月)",
    ar: "سنوياً (وفر شهرين)",
  },
  official_merchant: {
    en: "Official Merchant MomoPay",
    rw: "Official Company MomoPay",
    zh: "官方认证企业 MomoPay",
    ar: "حساب MomoPay التجاري الرسمي",
  },
  verified_rw: {
    en: "Verified 🇷🇼",
    rw: "Byemejwe 🇷🇼",
    zh: "已认证 🇷🇼",
    ar: "موثق 🇷🇼",
  },
  copy: {
    en: "Copy",
    rw: "Koporora",
    zh: "复制",
    ar: "نسخ",
  },
  copied: {
    en: "Copied",
    rw: "Yakoporowe",
    zh: "已复制",
    ar: "تم النسخ",
  },
  total_price: {
    en: "Total Price",
    rw: "Igiciro cyose",
    zh: "应付总额",
    ar: "إجمالي السعر",
  },
  billed_monthly: {
    en: "Billed monthly via Mobile Money",
    rw: "Kwishyura buri kwezi na Mobile Money",
    zh: "通过 Mobile Money 按月支付",
    ar: "يُدفع شهرياً عبر Mobile Money",
  },
  billed_yearly: {
    en: "10-month price for 12 months (2 mo free)",
    rw: "Amezi 12 ku giciro cy'amezi 10 (2 y'ubuntu)",
    zh: "12个月仅收10个月费用 (免费送2个月)",
    ar: "12 شهراً بسعر 10 أشهر (شهران مجاناً)",
  },
  per_month: {
    en: "/ month",
    rw: "/ ukwezi",
    zh: "/ 月",
    ar: "/ شهر",
  },
  per_year: {
    en: "/ year",
    rw: "/ umwaka",
    zh: "/ 年",
    ar: "/ سنة",
  },
  normal_desc: {
    en: "1 shop · Owner + 1 cashier PIN · Offline POS & Ideni",
    rw: "Iduka 1 · Nyir'iduka + umukozi 1 · POS & Ideni",
    zh: "1家店铺 · 店主+1位收银员PIN · 离线POS与赊账本",
    ar: "متجر واحد · مالك + 1 كاشير عبر PIN · نقاط بيع بدون إنترنت وديون",
  },
  pro_desc: {
    en: "3 shops · 5 cashiers · Import · AI advisor",
    rw: "Amaduka 3 · Abakozi 5 · Kwinjiza Excel · AI advisor",
    zh: "3家店铺 · 5位收银员 · Excel导入 · AI经营顾问",
    ar: "3 متاجر · 5 كاشير · استيراد Excel · مساعد ذكي",
  },
  phone_input_label: {
    en: "Phone Number (MTN or Airtel Money)",
    rw: "Nimero ya telefoni (MTN cyangwa Airtel Money)",
    zh: "手机号码 (MTN 或 Airtel Money)",
    ar: "رقم الهاتف (MTN أو Airtel Money)",
  },
  direct_stk_handshake: {
    en: "Direct STK Handshake",
    rw: "Iteganyijwe kwishyura",
    zh: "即时 STK 弹窗验证",
    ar: "طلب STK المباشر على الهاتف",
  },
  ussd_prompt_instruction: {
    en: "Or dial manually from your handset:",
    rw: "Cyangwa kanda kuri terefone yawe:",
    zh: "或通过手机手动拨打 USSD 代码：",
    ar: "أو اطلب الرمز يدوياً من هاتفك المحمول:",
  },
  copy_ussd: {
    en: "Copy USSD",
    rw: "Koporora USSD",
    zh: "复制 USSD 代码",
    ar: "نسخ رمز USSD",
  },
  all_cashiers_unlocked: {
    en: "All Staff Cashiers Unlocked:",
    rw: "Abakozi bose bahita bafungurirwa:",
    zh: "所有收银员终端立即解锁：",
    ar: "فتح جميع حسابات كاشير الموظفين فوراً:",
  },
  instant_access_devices: {
    en: "Instant access across all your registered devices.",
    rw: "Guhita ubona uburenganzira ku bikoresho byose byanditse.",
    zh: "即时同步授权至所有已绑定的设备。",
    ar: "وصول فوري عبر جميع أجهزتك المسجلة.",
  },
  pay_now_btn: {
    en: "Pay with MoMo Push Prompt",
    rw: "Ohereza Ubutumwa bwo Kwishyura",
    zh: "发送 MoMo 手机确认弹窗",
    ar: "إرسال طلب الدفع MoMo إلى الهاتف",
  },
  encrypted_security: {
    en: "256-bit Encrypted • Direct MTN MoMo / Airtel Money Connection",
    rw: "Bifite umutekano wuzuye • Byegeranye na MTN MoMo na Airtel Money",
    zh: "256位端到端安全加密 • 直连 MTN MoMo 与 Airtel Money 专线",
    ar: "تشفير آمن 256 بت • اتصال مباشر بشبكة MTN MoMo وAirtel Money",
  },
  auto_syncs: {
    en: "Auto-Syncs Supabase & Cashier Devices",
    rw: "Guhita bihuza Supabase n'abakozi",
    zh: "自动实时同步至云端与收银终端",
    ar: "مزامنة سحابية فورية مع أجهزة الكاشير",
  },
  success_title: {
    en: "Payment Successful! 🎉",
    rw: "Byakunze! Murakoze 🎉",
    zh: "支付成功！🎉",
    ar: "تم الدفع بنجاح! 🎉",
  },
  success_desc: {
    en: "Your Sella subscription is active. All cashier devices have been unlocked.",
    rw: "Ifatabuguzi ryawe rya Sella ryemejwe. Abakozi bose bafunguwe ako kanya.",
    zh: "您的 Sella 订阅已成功激活。所有收银机设备已解锁。",
    ar: "اشتراكك في Sella نشط الآن. تم تفعيل جميع أجهزة الكاشير.",
  },
  proceed_dashboard: {
    en: "Proceed to Dashboard",
    rw: "Komeza kuri Dashboard",
    zh: "进入控制台",
    ar: "الانتقال إلى لوحة التحكم",
  },
  failed_title: {
    en: "Payment Not Completed",
    rw: "Kwishyura Ntibyemejwe",
    zh: "支付未完成",
    ar: "لم تكتمل عملية الدفع",
  },
  failed_desc: {
    en: "The payment request timed out or was rejected. You can try again or check approvals in *182*7*1#.",
    rw: "Igihe cyo kwemeza cyarangiye cyangwa byanzwe. Ongera ugerageze cyangwa urebe kuri *182*7*1#.",
    zh: "支付请求已超时或被取消。您可以重新尝试或在手机上拨打 *182*7*1# 查看待授权。",
    ar: "انتهت مهلة طلب الدفع أو تم رفضه. يمكنك المحاولة مجدداً أو التحقق عبر *182*7*1#.",
  },
  change_phone: {
    en: "Change Phone",
    rw: "Hindura Nimero",
    zh: "更换手机号",
    ar: "تغيير رقم الهاتف",
  },
  try_again: {
    en: "Try Again",
    rw: "Ongera Ugerageze",
    zh: "重新尝试",
    ar: "إعادة المحاولة",
  },
  check_phone_title: {
    en: "Check Your Mobile Phone",
    rw: "Reba kuri Telefone Yawe",
    zh: "请查看您的手机",
    ar: "يرجى التحقق من هاتفك المحمول",
  },
  if_prompt_missing: {
    en: "If prompt did not appear:",
    rw: "Niba ubutumwa butahise buza:",
    zh: "如果未收到手机弹窗提示：",
    ar: "إذا لم يظهر الطلب على هاتفك تلقائياً:",
  },
  dial_approvals: {
    en: "1. Dial {ussd} (Pending approvals)",
    rw: "1. Kanda {ussd} (Kwemeza ubutumwa)",
    zh: "1. 拨打 {ussd} (待审批业务)",
    ar: "1. اطلب {ussd} (الموافقات المعلقة)",
  },
  or_dial_momo: {
    en: "2. Or pay directly with: {code}",
    rw: "2. Cyangwa wishyure kuri: {code}",
    zh: "2. 或直接拨打商家号支付：{code}",
    ar: "2. أو ادفع مباشرة للتاجر: {code}",
  },
  cancel_modal: {
    en: "Cancel or edit details",
    rw: "Hagarika cyangwa hindura uburyo",
    zh: "取消或修改支付信息",
    ar: "إلغاء أو تعديل البيانات",
  },
  invalid_phone: {
    en: "Enter a valid 10-digit Rwandan phone number starting with 07 (e.g., 078X XXX XXX).",
    rw: "Andika numero ya MTN cyangwa Airtel itangirwa na 07 (urugero: 078X XXX XXX).",
    zh: "请输入以 07 开头的 10 位卢旺达有效手机号码 (例如 078X XXX XXX)。",
    ar: "أدخل رقم هاتف رواندي صالح مكون من 10 أرقام يبدأ بـ 07 (مثال: 078X XXX XXX).",
  },
  signin_first: {
    en: "Please sign in to your shop account before completing payment.",
    rw: "Injira muri konti yawe mbere yo kwishyura.",
    zh: "在完成支付前，请先登录您的店铺账户。",
    ar: "يرجى تسجيل الدخول إلى حساب متجرك قبل إتمام الدفع.",
  },
  signin_btn: {
    en: "Sign In",
    rw: "Injira",
    zh: "登录",
    ar: "تسجيل الدخول",
  },
};

export function getCheckoutText(
  key: keyof typeof CHECKOUT_COPY,
  lang: AppLanguage,
  vars?: Record<string, string | number>
): string {
  const row = CHECKOUT_COPY[key];
  if (!row) return key;
  let text = row[lang as keyof CheckoutCopyEntry] || (lang === "en" ? row.en : row.rw) || row.en;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.split(`{${k}}`).join(String(v));
    }
  }
  return text;
}
