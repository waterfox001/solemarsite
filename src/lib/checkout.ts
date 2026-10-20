/**
 * SOL & MAR RENT A CAR — PONTO DE INTEGRAÇÃO OFICIAL DO CHECKOUT E PAGAMENTO
 *
 * Este módulo centraliza a estrutura do checkout de reservas e define o ponto exato
 * de conexão para o futuro provedor de pagamento (ex.: Mercado Pago, PagBank, Asaas,
 * Cielo ou adquirente com suporte a pré-autorização / bloqueio temporário de caução).
 *
 * DIRETRIZES COMERCIAIS DA LOCADORA:
 * 1. A caução é garantia da locação via bloqueio temporário no limite do cartão de crédito,
 *    liberada após a devolução do veículo e vistoria (não é cobrança definitiva nem receita).
 * 2. As diárias e opcionais compõem o valor efetivo da locação.
 * 3. O adiantamento para reserva (sinal) segue a regra cadastrada (padrão R$ 0 até definição).
 * 4. Não são gerados links fictícios ou simuladas aprovações automáticas sem confirmação real.
 * 5. Não são armazenados dados de cartão diretamente na aplicação.
 */

import type { Customer, Reservation, SelectedAdditional, Vehicle } from "./types";
import { brl, longDate } from "./format";
import { company } from "./env";

export interface CheckoutBreakdown {
  reservationId: string;
  reservationCode: string;
  vehicleName: string;
  vehicleCategory?: string;
  days: number;
  periodText: string;
  pickupLocation: string;
  returnLocation: string;
  dailyRate: number;
  dailySubtotal: number;
  additionals: SelectedAdditional[];
  additionalsSubtotal: number;
  rentalTotal: number;
  depositAmount: number;
  advancePaymentAmount: number;
  balanceOnPickup: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
}

export interface CheckoutSessionResult {
  ready: boolean;
  reservationCode: string;
  status: "pendente_checkout" | "aguardando_aprovacao";
  providerConfigured: boolean;
  providerName: string | null;
  checkoutUrl: string | null;
  message: string;
  breakdown: CheckoutBreakdown;
}

/**
 * Prepara e valida a sessão de checkout de uma reserva recém-criada.
 *
 * FUTURA INTEGRAÇÃO:
 * Quando o proprietário definir a plataforma de pagamento (ex.: Mercado Pago, PagBank, etc.),
 * insira a chamada de criação de preferência/cobrança dentro desta função:
 *
 * ```ts
 * if (gatewayCredentialsAvailable) {
 *   const preference = await createPaymentGatewaySession({
 *     external_reference: reservation.code,
 *     items: [...],
 *     preauthorization: reservation.deposit_amount, // se suportado pelo gateway
 *   });
 *   return { ... result, ready: true, checkoutUrl: preference.init_point };
 * }
 * ```
 */
export async function preparePaymentCheckoutSession(
  reservation: Reservation,
  vehicle: Vehicle,
  customer: Customer,
): Promise<CheckoutSessionResult> {
  const breakdown: CheckoutBreakdown = {
    reservationId: reservation.id,
    reservationCode: reservation.code,
    vehicleName: vehicle.name,
    vehicleCategory: vehicle.category,
    days: reservation.days,
    periodText: `${longDate(reservation.start_date)} às ${reservation.start_time || "09:00"} até ${longDate(reservation.end_date)} às ${reservation.end_time || "09:00"}`,
    pickupLocation: reservation.pickup_location || company.defaultPickupLocation,
    returnLocation: reservation.return_location || company.defaultPickupLocation,
    dailyRate: vehicle.daily_rate,
    dailySubtotal: reservation.daily_subtotal ?? reservation.days * vehicle.daily_rate,
    additionals: reservation.additionals || [],
    additionalsSubtotal: reservation.additionals_subtotal ?? 0,
    rentalTotal: reservation.rental_total,
    depositAmount: reservation.deposit_amount ?? vehicle.deposit_amount ?? 0,
    advancePaymentAmount: reservation.advance_payment_amount ?? 0,
    balanceOnPickup: reservation.balance_on_pickup ?? reservation.rental_total,
    customerName: customer.name,
    customerPhone: customer.phone,
    customerEmail: customer.email,
  };

  // Por enquanto, o provedor ainda não foi configurado pelo proprietário.
  // A reserva é salva como pendente e o checkout fica preparado.
  return {
    ready: false,
    reservationCode: reservation.code,
    status: "pendente_checkout",
    providerConfigured: false,
    providerName: null,
    checkoutUrl: null,
    message:
      "Reserva provisória registrada com sucesso no catálogo. A confirmação e as instruções de garantia/pagamento serão combinadas diretamente com a equipe da Sol & Mar.",
    breakdown,
  };
}

/**
 * Gera a mensagem estruturada oficial para encaminhamento pelo WhatsApp
 * apresentando cada valor discriminado conforme solicitado pela locadora.
 */
export function buildReservationWhatsAppMessage(breakdown: CheckoutBreakdown): string {
  const {
    reservationCode,
    vehicleName,
    vehicleCategory,
    days,
    periodText,
    pickupLocation,
    returnLocation,
    dailyRate,
    dailySubtotal,
    additionals,
    additionalsSubtotal,
    rentalTotal,
    depositAmount,
    advancePaymentAmount,
    balanceOnPickup,
    customerName,
    customerPhone,
    customerEmail,
  } = breakdown;

  const lines = [
    `*SOL & MAR RENT A CAR — RESERVA PROVISÓRIA REGISTRADA*`,
    `Código da Reserva: *${reservationCode}*`,
    `Status: *Pendente de Confirmação*`,
    ``,
    `*1. VEÍCULO ESCOLHIDO:*`,
    `• Modelo: *${vehicleName}*${vehicleCategory ? ` (${vehicleCategory})` : ""}`,
    dailyRate > 0 ? `• Diária base: ${brl(dailyRate)}/dia` : `• Diária base: A consultar com a equipe`,
    ``,
    `*2. PERÍODO DA LOCAÇÃO:*`,
    `• Período: ${periodText}`,
    `• Quantidade de diárias: *${days} diária(s)*`,
    `• Local de retirada: ${pickupLocation}`,
    `• Local de devolução: ${returnLocation}`,
    ``,
    `*3. OPCIONAIS SELECIONADOS:*`,
  ];

  if (additionals.length > 0) {
    for (const opt of additionals) {
      lines.push(
        `• ${opt.name} (${opt.type === "per_day" ? `${brl(opt.price)}/dia` : `${brl(opt.price)} taxa única`}): ${brl(opt.total)}`,
      );
    }
    lines.push(`• Subtotal de opcionais: ${brl(additionalsSubtotal)}`);
  } else {
    lines.push(`• Nenhum opcional selecionado.`);
  }

  lines.push(``);
  lines.push(`*4. DISCRIMINAÇÃO DOS VALORES:*`);
  if (dailyRate > 0) {
    lines.push(`• Diárias do veículo (${days}x): ${brl(dailySubtotal)}`);
    if (additionalsSubtotal > 0) {
      lines.push(`• Opcionais selecionados: +${brl(additionalsSubtotal)}`);
    }
    lines.push(`• *Valor Total da Locação:* *${brl(rentalTotal)}*`);
  } else {
    lines.push(`• Valor da locação: Diária sob consulta com a equipe`);
  }

  lines.push(``);
  lines.push(`*5. GARANTIA DA LOCAÇÃO (CAUÇÃO):*`);
  if (depositAmount > 0) {
    lines.push(`• *Caução Exigida:* *${brl(depositAmount)}*`);
    lines.push(
      `• *Nota sobre a caução:* Bloqueio temporário (pré-autorização) no cartão de crédito na retirada, liberado integralmente após a devolução do veículo sem avarias ou multas. Não é uma cobrança definitiva.`,
    );
  } else {
    lines.push(
      `• Caução de garantia: A combinar no atendimento (bloqueio no cartão de crédito na retirada).`,
    );
  }

  lines.push(``);
  lines.push(`*6. CONDIÇÕES DE PAGAMENTO:*`);
  if (advancePaymentAmount > 0) {
    lines.push(`• *Valor antecipado para reserva:* ${brl(advancePaymentAmount)}`);
    lines.push(`• *Saldo restante da locação a pagar na retirada:* ${brl(balanceOnPickup)}`);
  } else {
    lines.push(`• *Valor a pagar antecipadamente:* R$ 0,00 (isenção de sinal antecipado)`);
    if (dailyRate > 0) {
      lines.push(`• *Saldo da locação a acertar na retirada:* ${brl(balanceOnPickup)}`);
    } else {
      lines.push(`• *Saldo da locação a acertar na retirada:* A combinar no atendimento`);
    }
  }

  lines.push(``);
  lines.push(`*7. DADOS DO CLIENTE:*`);
  lines.push(`• Nome completo: ${customerName}`);
  lines.push(`• Telefone / WhatsApp: ${customerPhone}`);
  if (customerEmail) {
    lines.push(`• E-mail: ${customerEmail}`);
  }

  lines.push(``);
  lines.push(
    `_Aguardando conferência e validação da equipe da Sol & Mar Rent a Car (${company.phoneInternational})._`,
  );

  return lines.join("\n");
}
