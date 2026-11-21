import { getAppLanguage, type AppLanguage } from "@/lib/appLanguage";

type Lang = AppLanguage;

function lang(): Lang {
  return getAppLanguage();
}

/** Debt reminder sent to the customer. Kinyarwanda text is the shop wording already in use. */
export function debtReminderMessage(
  items: string,
  amount: string,
  dueDate?: string,
  language?: Lang
): string {
  const itemsParen = items.startsWith("(") ? items : `(${items} )`;
  const due = dueDate ? ` · ${dueDate}` : "";
  switch (language || lang()) {
    case "en":
      return [
        "Hello valued customer, we wanted to remind you that you still have these items on credit:",
        itemsParen,
        `Amount: ${amount}${due}`,
        "Please review the PDF and come settle when you can.",
        "Thank you very much!",
      ].join("\n");
    case "fr":
      return [
        "Bonjour cher client, nous vous rappelons que vous avez encore ces articles à crédit :",
        itemsParen,
        `Montant : ${amount}${due}`,
        "Consultez le PDF et venez régler dès que vous pouvez.",
        "Merci beaucoup !",
      ].join("\n");
    case "sw":
      return [
        "Habari mteja, tunakukumbusha bado una bidhaa hizi kwa mkopo:",
        itemsParen,
        `Kiasi: ${amount}${due}`,
        "Tazama PDF kisha uje kulipa utakapopata nafasi.",
        "Asante sana!",
      ].join("\n");
    case "rn":
      return [
        "Kaze mukiriya mwiza, turashaka kukwibutsa ko usigaje ibi bintu ku ideni:",
        itemsParen,
        `Amafaranga: ${amount}${due}`,
        "Raba PDF twaguhawe hanyuma uze kwishura igihe ufise umwanya.",
        "Urakoze cane!",
      ].join("\n");
    case "lg":
      return [
        "Oli otya omukasitoma, tukujjukiza nti olina ebyamaguzi bino ku banja:",
        itemsParen,
        `Ssente: ${amount}${due}`,
        "Kebera PDF olwo ojje osasule nga ofunye obudde.",
        "Webale nnyo!",
      ].join("\n");
    case "es":
      return [
        "Hola, estimado cliente. Le recordamos que todavía tiene estos artículos a crédito:",
        itemsParen,
        `Importe: ${amount}${due}`,
        "Revise el PDF y venga a pagar cuando pueda.",
        "¡Muchas gracias!",
      ].join("\n");
    case "pt":
      return [
        "Olá, caro cliente. Lembramos que ainda tem estes artigos a crédito:",
        itemsParen,
        `Valor: ${amount}${due}`,
        "Veja o PDF e venha pagar quando puder.",
        "Muito obrigado!",
      ].join("\n");
    case "ar":
      return [
        "مرحباً عميلنا الكريم، نذكّرك أن هذه الأصناف ما زالت على الحساب:",
        itemsParen,
        `المبلغ: ${amount}${due}`,
        "راجع ملف PDF وتعال للتسوية عندما تستطيع.",
        "شكراً جزيلاً!",
      ].join("\n");
    case "zh":
      return [
        "您好，提醒您以下商品仍是赊账：",
        itemsParen,
        `金额：${amount}${due}`,
        "请查看 PDF，方便时来结清。",
        "非常感谢！",
      ].join("\n");
    default:
      return [
        "Muraho mukiliya mwiza twifuzaga kubibutsa ko mufite mwafashe ibi bintu bikurikira",
        itemsParen,
        `Amafaranga: ${amount}${due}`,
        "nimubone umwanya murebe PDF twabahaye muze kuyigenderaho mwishyura.",
        "Turabashimiye cyane!",
      ].join("\n");
  }
}

export function debtWhatsAppMessage(opts: {
  itemsParen: string;
  shopName: string;
  payPhone: string;
  language?: Lang;
}): string {
  const l = opts.language || lang();
  const intro = {
    rw: [
      "Muraho mukiliya mwiza twifuzaga kubibutsa ko mufite mwafashe ibi bintu bikurikira",
      opts.itemsParen,
      "nimubone umwanya murebe PDF twabahaye muze kuyigenderaho mwishyura.",
      "Turabashimiye cyane!",
    ],
    en: [
      "Hello valued customer, we wanted to remind you that you still have these items on credit:",
      opts.itemsParen,
      "Please review the PDF and come settle when you can.",
      "Thank you very much!",
    ],
    fr: [
      "Bonjour cher client, nous vous rappelons que vous avez encore ces articles à crédit :",
      opts.itemsParen,
      "Consultez le PDF et venez régler dès que vous pouvez.",
      "Merci beaucoup !",
    ],
    sw: [
      "Habari mteja, tunakukumbusha bado una bidhaa hizi kwa mkopo:",
      opts.itemsParen,
      "Tazama PDF kisha uje kulipa utakapopata nafasi.",
      "Asante sana!",
    ],
    rn: [
      "Kaze mukiriya mwiza, turashaka kukwibutsa ko usigaje ibi bintu ku ideni:",
      opts.itemsParen,
      "Raba PDF twaguhawe hanyuma uze kwishura igihe ufise umwanya.",
      "Urakoze cane!",
    ],
    lg: [
      "Oli otya omukasitoma, tukujjukiza nti olina ebyamaguzi bino ku banja:",
      opts.itemsParen,
      "Kebera PDF olwo ojje osasule nga ofunye obudde.",
      "Webale nnyo!",
    ],
    es: [
      "Hola, estimado cliente. Le recordamos que todavía tiene estos artículos a crédito:",
      opts.itemsParen,
      "Revise el PDF y venga a pagar cuando pueda.",
      "¡Muchas gracias!",
    ],
    pt: [
      "Olá, caro cliente. Lembramos que ainda tem estes artigos a crédito:",
      opts.itemsParen,
      "Veja o PDF e venha pagar quando puder.",
      "Muito obrigado!",
    ],
    ar: [
      "مرحباً عميلنا الكريم، نذكّرك أن هذه الأصناف ما زالت على الحساب:",
      opts.itemsParen,
      "راجع ملف PDF وتعال للتسوية عندما تستطيع.",
      "شكراً جزيلاً!",
    ],
    zh: [
      "您好，提醒您以下商品仍是赊账：",
      opts.itemsParen,
      "请查看 PDF，方便时来结清。",
      "非常感谢！",
    ],
  }[l];
  return [...intro, "", shopPayLine(opts.shopName, opts.payPhone, l)].join("\n");
}

function shopPayLine(shopName: string, payPhone: string, language?: Lang): string {
  switch (language || lang()) {
    case "en":
      return `Thank you for shopping at ${shopName}\nPay to: ${payPhone}`;
    case "fr":
      return `Merci d'avoir acheté chez ${shopName}\nPayez au : ${payPhone}`;
    case "sw":
      return `Asante kwa kununua ${shopName}\nLipa kwa: ${payPhone}`;
    case "rn":
      return `Urakoze kugura kwa ${shopName}\nIshyura kuri: ${payPhone}`;
    case "lg":
      return `Webale kugula ku ${shopName}\nSasula ku: ${payPhone}`;
    case "es":
      return `Gracias por comprar en ${shopName}\nPague a: ${payPhone}`;
    case "pt":
      return `Obrigado por comprar na ${shopName}\nPague para: ${payPhone}`;
    case "ar":
      return `شكراً لتسوقك في ${shopName}\nادفع إلى: ${payPhone}`;
    case "zh":
      return `感谢在 ${shopName} 购物\n付款至：${payPhone}`;
    default:
      return `Murakoze kugana ${shopName}\nIshura kuri: ${payPhone}`;
  }
}

export function orderPreparingMessage(customerName: string, orderNumber: string, language?: Lang): string {
  switch (language || lang()) {
    case "en":
      return `Hello ${customerName}, your order ${orderNumber} is now being prepared.`;
    case "fr":
      return `Bonjour ${customerName}, votre commande ${orderNumber} est en préparation.`;
    case "sw":
      return `Habari ${customerName}, oda yako ${orderNumber} inatayarishwa.`;
    case "rn":
      return `Kaze ${customerName}, komande yanyu ${orderNumber} twatanguje kuyitegura.`;
    case "lg":
      return `Oli otya ${customerName}, oda yo ${orderNumber} tutandise okugiteekateeka.`;
    case "es":
      return `Hola ${customerName}, su pedido ${orderNumber} se está preparando.`;
    case "pt":
      return `Olá ${customerName}, a sua encomenda ${orderNumber} está a ser preparada.`;
    case "ar":
      return `مرحباً ${customerName}، طلبك ${orderNumber} قيد التحضير.`;
    case "zh":
      return `您好 ${customerName}，订单 ${orderNumber} 正在准备。`;
    default:
      return `Muraho ${customerName}, turabamenyesha ko komande yanyu ${orderNumber} twatangiye kuyitegura.`;
  }
}

export function shopInquiryMessage(shopName: string, language?: Lang): string {
  switch (language || lang()) {
    case "en":
      return `Hello ${shopName}, I found your shop on Sella`;
    case "fr":
      return `Bonjour ${shopName}, j'ai trouvé votre boutique sur Sella`;
    case "sw":
      return `Habari ${shopName}, nimeona duka lako kwenye Sella`;
    case "rn":
      return `Kaze ${shopName}, nabonye iduka ryanyu kuri Sella`;
    case "lg":
      return `Oli otya ${shopName}, ndabye edduuka lyo ku Sella`;
    case "es":
      return `Hola ${shopName}, encontré su tienda en Sella`;
    case "pt":
      return `Olá ${shopName}, encontrei a sua loja na Sella`;
    case "ar":
      return `مرحباً ${shopName}، وجدت متجرك على Sella`;
    case "zh":
      return `您好 ${shopName}，我在 Sella 上看到了你的店铺`;
    default:
      return `Muraho ${shopName}, nabonye iduka ryanyu kuri Sella`;
  }
}

export function cashAcknowledgmentMessage(amount: string, method: string, remaining: string, language?: Lang): string {
  switch (language || lang()) {
    case "en":
      return `Thank you! We received ${amount} FRW (${method}). Balance: ${remaining} FRW. Sella.`;
    case "fr":
      return `Merci ! Nous avons reçu ${amount} FRW (${method}). Reste : ${remaining} FRW. Sella.`;
    case "sw":
      return `Asante! Tumepokea ${amount} FRW (${method}). Salio: ${remaining} FRW. Sella.`;
    case "rn":
      return `Urakoze! Twakiriye ${amount} FRW (${method}). Asigaye: ${remaining} FRW. Sella.`;
    case "lg":
      return `Webale! Tufunye ${amount} FRW (${method}). Kisigadde: ${remaining} FRW. Sella.`;
    case "es":
      return `¡Gracias! Recibimos ${amount} FRW (${method}). Saldo: ${remaining} FRW. Sella.`;
    case "pt":
      return `Obrigado! Recebemos ${amount} FRW (${method}). Saldo: ${remaining} FRW. Sella.`;
    case "ar":
      return `شكراً! استلمنا ${amount} FRW (${method}). المتبقي: ${remaining} FRW. Sella.`;
    case "zh":
      return `谢谢！已收到 ${amount} FRW（${method}）。余额：${remaining} FRW。Sella。`;
    default:
      return `Murakoze cyane! Twakiriye ${amount} FRW (${method}). Asigaye: ${remaining} FRW. Sella.`;
  }
}

export function paymentReceiptMessage(
  receiptId: string,
  amount: string,
  method: string,
  clientName: string,
  remaining: string,
  language?: Lang
): string {
  switch (language || lang()) {
    case "en":
      return `Receipt #${receiptId}: We received ${amount} FRW (${method}) from ${clientName}. Balance: ${remaining} FRW. Thank you for using Sella!`;
    case "fr":
      return `Reçu n°${receiptId} : nous avons reçu ${amount} FRW (${method}) de ${clientName}. Reste : ${remaining} FRW. Merci d'utiliser Sella !`;
    case "sw":
      return `Risiti #${receiptId}: Tumepokea ${amount} FRW (${method}) kutoka kwa ${clientName}. Salio: ${remaining} FRW. Asante kwa kutumia Sella!`;
    case "rn":
      return `Resi #${receiptId}: Twakiriye ${amount} FRW (${method}) kuva kuri ${clientName}. Asigaye: ${remaining} FRW. Urakoze gukoresha Sella!`;
    case "lg":
      return `Risiti #${receiptId}: Tufunye ${amount} FRW (${method}) okuva eri ${clientName}. Kisigadde: ${remaining} FRW. Webale okukozesa Sella!`;
    case "es":
      return `Recibo n.º ${receiptId}: recibimos ${amount} FRW (${method}) de ${clientName}. Saldo: ${remaining} FRW. ¡Gracias por usar Sella!`;
    case "pt":
      return `Recibo n.º ${receiptId}: recebemos ${amount} FRW (${method}) de ${clientName}. Saldo: ${remaining} FRW. Obrigado por usar a Sella!`;
    case "ar":
      return `إيصال رقم ${receiptId}: استلمنا ${amount} FRW (${method}) من ${clientName}. المتبقي: ${remaining} FRW. شكراً لاستخدام Sella!`;
    case "zh":
      return `收据 #${receiptId}：已收到 ${clientName} 的 ${amount} FRW（${method}）。余额：${remaining} FRW。感谢使用 Sella！`;
    default:
      return `Resi #${receiptId}: Twakiriye ${amount} FRW (${method}) kuva kuri ${clientName}. Asigaye: ${remaining} FRW. Murakoze gukoresha Sella!`;
  }
}

export function offlineBannerText(kind: "offline" | "pending" | "conflict", count = 0, language?: Lang): string {
  const l = language || lang();
  if (kind === "conflict") {
    switch (l) {
      case "en":
        return `${count} sale(s) kept on this device — stock conflict, review needed`;
      case "fr":
        return `${count} vente(s) gardée(s) sur cet appareil — conflit de stock, à vérifier`;
      case "sw":
        return `Mauzo ${count} yamebaki kwenye simu — mgongano wa stoo, yakague`;
      case "rn":
        return `Igurisha ${count} ryasigaye kuri iki gikoresho — stock irakuye, raba`;
      case "lg":
        return `Otunda ${count} kusigadde ku ssimu — sitooka eyawakanira, kebera`;
      case "es":
        return `${count} venta(s) guardada(s) en este teléfono — conflicto de stock, hay que revisar`;
      case "pt":
        return `${count} venda(s) guardada(s) neste telefone — conflito de stock, é preciso rever`;
      case "ar":
        return `${count} عملية بيع محفوظة على هذا الهاتف — تعارض في المخزون، يلزم المراجعة`;
      case "zh":
        return `${count} 笔销售保存在本机 — 库存冲突，需要核对`;
      default:
        return `${count} igurisha ryasigaye kuri iyi telefoni — sitoki irakubye, isuzume`;
    }
  }
  if (kind === "pending") {
    switch (l) {
      case "en":
        return `${count} offline action(s) waiting to sync`;
      case "fr":
        return `${count} action(s) hors ligne en attente d'envoi`;
      case "sw":
        return `Vitendo ${count} vya nje ya mtandao vinasubiri kutumwa`;
      case "rn":
        return `Ibikorwa ${count} bidasanzwe kuri internet birindira koherezwa`;
      case "lg":
        return `Ebikolwa ${count} ebitali ku mutimbagano birinda okusindikibwa`;
      case "es":
        return `${count} acción(es) sin conexión esperando enviarse`;
      case "pt":
        return `${count} ação(ões) offline à espera de envio`;
      case "ar":
        return `${count} إجراء دون اتصال بانتظار الإرسال`;
      case "zh":
        return `${count} 条离线操作等待同步`;
      default:
        return `${count} ibikorwa byo nta interineti birindira koherezwa`;
    }
  }
  switch (l) {
    case "en":
      return "No internet — this phone keeps working; sync returns when you are online.";
    case "fr":
      return "Pas d'internet — le téléphone continue ; la synchro reprend dès que vous êtes en ligne.";
    case "sw":
      return "Hakuna intaneti — simu inaendelea kufanya kazi; itatuma data ukiunganishwa.";
    case "rn":
      return "Nta internet — telefone ikora ; sync izogaruka igihe uhuze.";
    case "lg":
      return "Teliwa intaneti — essimu ekola ; sync eddako nga omazze okuyungibwa.";
    case "es":
      return "Sin internet — el teléfono sigue funcionando; se sincroniza al volver la conexión.";
    case "pt":
      return "Sem internet — o telefone continua a funcionar; sincroniza quando voltar a ligação.";
    case "ar":
      return "لا يوجد إنترنت — الهاتف يواصل العمل؛ تعود المزامنة عند الاتصال.";
    case "zh":
      return "没有网络 — 手机仍可使用；联网后会自动同步。";
    default:
      return "Nta interineti — amakuru ya locale akora; sync izagaruka iyo wahuye.";
  }
}
