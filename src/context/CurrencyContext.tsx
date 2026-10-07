import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SupportedCurrency,
  CurrencyConfig,
  GatewayIdentifier,
  LandlordGatewayConfig,
  GatewayApiConfig,
  PaymentRoutingResult,
  FinancialTransaction,
  MesombPluginConfig,
} from '../types';
import { useSecurity } from './SecurityContext';
import {
  DEFAULT_MESOMB_PLUGIN_CONFIG,
  getSavedMesombPluginConfig,
  saveMesombPluginConfig,
} from '../utils/mesombGatewayUtils';

export const CURRENCY_CONFIGS: Record<SupportedCurrency, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🇺🇸',
    rateAgainstUSD: 1.0,
    decimals: 2,
    formatTemplate: '${amount}',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateAgainstUSD: 0.92,
    decimals: 2,
    formatTemplate: '€{amount}',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateAgainstUSD: 0.78,
    decimals: 2,
    formatTemplate: '£{amount}',
  },
  CFA: {
    code: 'CFA',
    symbol: 'FCFA',
    name: 'CFA Franc (CEMAC / UEMOA)',
    flag: '🇨🇲',
    rateAgainstUSD: 605.0,
    decimals: 0,
    formatTemplate: '{amount} FCFA',
  },
};

// Initial Landlord Gateway Settings from Framework Page 5 with Super Admin API infrastructure
export const INITIAL_LANDLORD_GATEWAYS: LandlordGatewayConfig[] = [
  {
    id: 'mesomb',
    name: 'MeSomb Mobile Payment',
    phpClass: 'class-wc-gateway-mesomb.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.0,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant (Hosted Checkout / USSD Push)',
    description: 'Pay with your Mobile/Orange Money account.',
    badge: 'Official MeSomb Gateway 🇨🇲',
    iconName: 'Smartphone',
    countries: ['Cameroon', 'Niger'],
    isCameroonMethod: true,
    cameroonUssd: '*126# / #150#',
    apiConfig: {
      endpointUrl: 'https://mesomb.hachther.com/api/v1.1/payment/online/',
      environment: 'production',
      applicationKey: 'app_mesomb_live_7a92cf18b0',
      accessKey: 'acc_mesomb_4920de8812',
      apiKeyPublic: 'acc_mesomb_4920de8812',
      apiKeySecretMasked: 'sec_mesomb_live_99d1••••••••••••••••••••••••',
      secretKeyMasked: 'sec_mesomb_live_99d1••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/mesomb',
      webhookSecretMasked: 'whsec_mesomb_77c4••••••••••••••••',
      lastRotated: '2026-09-18 10:20 UTC',
      lastPingMs: 36,
      status: 'connected',
      merchantId: 'MESOMB_MERCHANT_CM_8892',
      ussdCode: '*126# / #150#',
      serviceProviderCode: 'MESOMB-DUAL-MOMO-OM',
      operatorNetwork: 'MTN MoMo & Orange Money Cameroun',
      cameroonRegionCoverage: 'All 10 Regions of Cameroon (Douala, Yaoundé, Bafoussam, Bamenda, Garoua, etc.)',
      mesombService: 'AUTO',
    },
  },
  {
    id: 'mtn_momo',
    name: 'MTN MoMo Cameroon (Powered by MeSomb)',
    phpClass: 'MTNMomoGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.2,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant (USSD *126# push)',
    description: 'Direct integration with MTN Mobile Money Cameroon API (*126# USSD collection & push notification via MeSomb).',
    badge: 'Market Leader 🇨🇲',
    iconName: 'Smartphone',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*126#',
    apiConfig: {
      endpointUrl: 'https://mesomb.hachther.com/api/v1.1/payment/online/',
      environment: 'production',
      apiKeyPublic: 'momo_pub_live_77e92d8f9a',
      apiKeySecretMasked: 'momo_sec_live_99a8••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/mtn-momo',
      webhookSecretMasked: 'whsec_momo_88f7••••••••••••••••',
      lastRotated: '2026-09-15 08:30 UTC',
      lastPingMs: 44,
      status: 'connected',
      merchantId: 'CM_MOMO_MERCHANT_237991',
      ussdCode: '*126#',
      serviceProviderCode: 'MTN-CM-MOMO-COLLECT',
      operatorNetwork: 'MTN Cameroon Network',
      cameroonRegionCoverage: 'All 10 Regions (Douala, Yaoundé, Bafoussam, Bamenda, Garoua, etc.)',
      mesombService: 'MTN',
    },
  },
  {
    id: 'orange_money',
    name: 'Orange Money Cameroun (Powered by MeSomb)',
    phpClass: 'OrangeMoneyGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.5,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant (USSD #150# push)',
    description: 'Orange Money WebPay API (#150#) instant mobile wallet payment confirmation across Cameroon via MeSomb.',
    badge: 'High Adoption 🇨🇲',
    iconName: 'Smartphone',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '#150#',
    apiConfig: {
      endpointUrl: 'https://mesomb.hachther.com/api/v1.1/payment/online/',
      environment: 'production',
      apiKeyPublic: 'om_pub_live_38b14ca0e2',
      apiKeySecretMasked: 'om_sec_live_67c2••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/orange-money',
      webhookSecretMasked: 'whsec_om_44e1••••••••••••••••',
      lastRotated: '2026-09-12 14:15 UTC',
      lastPingMs: 52,
      status: 'connected',
      merchantId: 'OM_CM_PARTNER_694002',
      ussdCode: '#150#',
      serviceProviderCode: 'OM-WEBPAY-COLLECTION',
      operatorNetwork: 'Orange Cameroun',
      cameroonRegionCoverage: 'Nationwide (Littoral, Centre, Ouest, Sud-Ouest, etc.)',
      mesombService: 'ORANGE',
    },
  },
  {
    id: 'express_union',
    name: 'Express Union Mobile Money (EU Mobile)',
    phpClass: 'ExpressUnionGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.0,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant (EU Mobile & Agency)',
    description: 'Cameroon domestic microfinance & money transfer network with 700+ physical branches across all 10 regions and *050# mobile wallet.',
    badge: '700+ Branches 🇨🇲',
    iconName: 'Building2',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*050#',
    apiConfig: {
      endpointUrl: 'https://api.expressunion.net/v2/eumobile/payment',
      environment: 'production',
      apiKeyPublic: 'eu_pub_live_4492b0c1',
      apiKeySecretMasked: 'eu_sec_live_1189••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/express-union',
      webhookSecretMasked: 'whsec_eu_3377••••••••••••••••',
      lastRotated: '2026-09-14 10:00 UTC',
      lastPingMs: 46,
      status: 'connected',
      merchantId: 'EU_AGENCY_CM_00441',
      ussdCode: '*050#',
      serviceProviderCode: 'EU-MOBILE-WALLET-V2',
      operatorNetwork: 'Express Union Finance SA',
      cameroonRegionCoverage: 'Complete coverage across all 10 administrative regions',
    },
  },
  {
    id: 'gimac_pay',
    name: 'GIMAC Pay (CEMAC Interbank Network)',
    phpClass: 'GimacPayGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 0.8,
    feeFixedUSD: 0.1,
    settlementSpeed: 'Instant Inter-switch',
    description: 'Regional electronic switch connecting Cameroon banks, microfinances, and mobile money operators for instant interoperable clearing.',
    badge: 'CEMAC Switch 🇨🇲',
    iconName: 'CreditCard',
    countries: ['Cameroon', 'CEMAC'],
    isCameroonMethod: true,
    cameroonUssd: 'GIMAC Interoperable',
    apiConfig: {
      endpointUrl: 'https://api.gimacpay.beac.int/v1/switch/transfer',
      environment: 'production',
      apiKeyPublic: 'gimac_participant_cm_981',
      apiKeySecretMasked: 'gimac_sec_cert_••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/gimac-pay',
      webhookSecretMasked: 'whsec_gimac_55e2••••••••••••••••',
      lastRotated: '2026-09-11 09:30 UTC',
      lastPingMs: 39,
      status: 'connected',
      merchantId: 'GIMAC_PARTICIPANT_BEAC_CM',
      serviceProviderCode: 'GIMAC-INTERBANK-TRANSFER',
      operatorNetwork: 'GIMAC CEMAC (BEAC)',
      cameroonRegionCoverage: 'Inter-bank and cross-operator across Cameroon & CEMAC',
    },
  },
  {
    id: 'camerpay',
    name: 'CamerPay National Aggregator',
    phpClass: 'CamerPayGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.0,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant',
    description: 'National multi-channel aggregation switch connecting MoMo, OM, EU, and CEMAC local cards in Douala and Yaoundé.',
    badge: 'National Switch 🇨🇲',
    iconName: 'CreditCard',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: 'Multi-Operator',
    apiConfig: {
      endpointUrl: 'https://api.camerpay.cm/v2/payment/initiate',
      environment: 'production',
      apiKeyPublic: 'cp_pub_live_92d716ef',
      apiKeySecretMasked: 'cp_sec_live_55a9••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/camerpay',
      webhookSecretMasked: 'whsec_cp_99d2••••••••••••••••',
      lastRotated: '2026-09-10 11:20 UTC',
      lastPingMs: 38,
      status: 'connected',
      merchantId: 'CAMERPAY_MERCHANT_DLA_104',
      serviceProviderCode: 'CP-AGGREGATOR-DUO',
      operatorNetwork: 'CamerPay Cameroon',
      cameroonRegionCoverage: 'Douala, Yaoundé, Bafoussam, Kribi, Limbe',
    },
  },
  {
    id: 'afriland_sara',
    name: 'Afriland First Bank (Sara Money)',
    phpClass: 'AfrilandSaraGateway.php',
    active: true,
    category: 'bank_transfer',
    supportedCurrencies: ['CFA'],
    feePercentage: 1.1,
    feeFixedUSD: 0.0,
    settlementSpeed: 'Instant (Account/Sara App)',
    description: 'Cameroon largest indigenous private commercial bank with Sara Money e-wallet, Flash Transfer, and direct RIB debit for rent payments.',
    badge: 'Premier Bank 🇨🇲',
    iconName: 'Building2',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*158#',
    apiConfig: {
      endpointUrl: 'https://api.afrilandfirstbank.com/saramoney/v2/merchant/collect',
      environment: 'production',
      apiKeyPublic: 'sara_partner_cm_10029',
      apiKeySecretMasked: 'sara_sec_live_8832••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/afriland-sara',
      webhookSecretMasked: 'whsec_sara_6641••••••••••••••••',
      lastRotated: '2026-09-09 13:00 UTC',
      lastPingMs: 42,
      status: 'connected',
      merchantId: 'AFRILAND_RIB_10005_00001',
      ussdCode: '*158#',
      serviceProviderCode: 'SARA-MERCHANT-COLLECTION',
      operatorNetwork: 'Afriland First Bank Cameroun',
      cameroonRegionCoverage: 'All branches and Sara Money points across Cameroon',
    },
  },
  {
    id: 'uba_cameroon',
    name: 'UBA Cameroon (Magic Banking / Africash)',
    phpClass: 'UbaCameroonGateway.php',
    active: true,
    category: 'bank_transfer',
    supportedCurrencies: ['CFA', 'USD', 'EUR'],
    feePercentage: 0.9,
    feeFixedUSD: 0.2,
    settlementSpeed: 'Real-Time / T+0',
    description: 'United Bank for Africa Cameroon direct account debits, Africash remittance, and *019# Magic Banking landlord collections.',
    badge: 'Direct Debit 🇨🇲',
    iconName: 'Building2',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*019#',
    apiConfig: {
      endpointUrl: 'https://api.ubagroup.com/cameroon/v1/directdebit/collect',
      environment: 'production',
      apiKeyPublic: 'uba_cm_merchant_7721',
      apiKeySecretMasked: 'uba_sec_live_9901••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/uba-cameroon',
      webhookSecretMasked: 'whsec_uba_8812••••••••••••••••',
      lastRotated: '2026-09-08 15:40 UTC',
      lastPingMs: 45,
      status: 'connected',
      merchantId: 'UBA_CM_TERMINAL_505',
      ussdCode: '*019#',
      serviceProviderCode: 'UBA-DIRECT-DEBIT-SERVICE',
      operatorNetwork: 'UBA Cameroon SA',
      cameroonRegionCoverage: 'Douala, Yaoundé, Bamenda, Buea, Kumba, Maroua',
    },
  },
  {
    id: 'campost_yoban',
    name: 'CAMPOST Yoban (National Postal E-Money)',
    phpClass: 'CampostYobanGateway.php',
    active: true,
    category: 'digital_wallet',
    supportedCurrencies: ['CFA'],
    feePercentage: 0.7,
    feeFixedUSD: 0.0,
    settlementSpeed: 'T+1 Post Payout',
    description: 'Cameroon Postal Services (CAMPOST) public postal financial services, Yoban electronic wallet, and counters across remote divisions.',
    badge: 'National Post 🇨🇲',
    iconName: 'Building2',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*855#',
    apiConfig: {
      endpointUrl: 'https://api.yoban.campost.cm/v1/merchant/pay',
      environment: 'production',
      apiKeyPublic: 'yoban_client_cm_5532',
      apiKeySecretMasked: 'yoban_sec_live_2290••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/campost-yoban',
      webhookSecretMasked: 'whsec_yoban_4401••••••••••••••••',
      lastRotated: '2026-09-06 11:15 UTC',
      lastPingMs: 58,
      status: 'connected',
      merchantId: 'CAMPOST_POSTAL_MERCHANT_237',
      ussdCode: '*855#',
      serviceProviderCode: 'CAMPOST-YOBAN-PAYMENT',
      operatorNetwork: 'Cameroon Postal Services (MINPOSTEL)',
      cameroonRegionCoverage: 'All 250+ postal offices across Cameroon',
    },
  },
  {
    id: 'ecobank_cameroon',
    name: 'Ecobank Cameroon (Xpress Cash / Omni Lite)',
    phpClass: 'EcobankCameroonGateway.php',
    active: true,
    category: 'bank_transfer',
    supportedCurrencies: ['CFA', 'USD', 'EUR'],
    feePercentage: 1.0,
    feeFixedUSD: 0.1,
    settlementSpeed: 'Same-Day',
    description: 'Ecobank Cameroon corporate collections, tokenized recurring rent debit, and Xpress Cash cardless payments.',
    badge: 'Pan-African 🇨🇲',
    iconName: 'Building2',
    countries: ['Cameroon'],
    isCameroonMethod: true,
    cameroonUssd: '*326#',
    apiConfig: {
      endpointUrl: 'https://developer.ecobank.com/cameroon/v2/corporate/collect',
      environment: 'production',
      apiKeyPublic: 'eco_cm_corp_88190',
      apiKeySecretMasked: 'eco_sec_live_4472••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/ecobank-cameroon',
      webhookSecretMasked: 'whsec_eco_3391••••••••••••••••',
      lastRotated: '2026-09-07 14:00 UTC',
      lastPingMs: 41,
      status: 'connected',
      merchantId: 'ECOBANK_CM_CLIENT_9902',
      ussdCode: '*326#',
      serviceProviderCode: 'ECOBANK-OMNI-COLLECTION',
      operatorNetwork: 'Ecobank Cameroun',
      cameroonRegionCoverage: 'Douala, Yaoundé, Bafoussam, Garoua, Ngaoundéré',
    },
  },
  {
    id: 'elyonpay',
    name: 'ElyonPay (Cameroon & Diaspora Gateway)',
    phpClass: 'ElyonPayGateway.php',
    active: true,
    category: 'mobile_money',
    supportedCurrencies: ['CFA', 'EUR', 'USD', 'GBP'],
    feePercentage: 1.8,
    feeFixedUSD: 0.0,
    settlementSpeed: 'T+1 Settlement',
    description: 'Cross-border diaspora gateway for Cameroonians in Europe, USA, UK & Canada paying rent in Cameroon in CFA, Euro, or USD.',
    badge: 'Diaspora Switch 🇨🇲',
    iconName: 'Globe',
    countries: ['Cameroon', 'Diaspora (EU/USA/UK)', 'CEMAC'],
    isCameroonMethod: true,
    cameroonUssd: 'Web / App',
    apiConfig: {
      endpointUrl: 'https://api.elyonpay.com/v1/settlements/crossborder',
      environment: 'production',
      apiKeyPublic: 'elyon_pub_live_1092fe',
      apiKeySecretMasked: 'elyon_sec_live_3388••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/elyonpay',
      webhookSecretMasked: 'whsec_elyon_77a1••••••••••••••••',
      lastRotated: '2026-09-08 16:45 UTC',
      lastPingMs: 65,
      status: 'connected',
      merchantId: 'ELYON_DIASPORA_CM_001',
      serviceProviderCode: 'ELYON-CROSSBORDER-PAY',
      operatorNetwork: 'ElyonPay Central Africa',
      cameroonRegionCoverage: 'Cameroon nationwide + International Diaspora',
    },
  },
  {
    id: 'visa',
    name: 'Visa Card',
    phpClass: 'VisaGateway.php',
    active: true,
    category: 'card',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CFA'],
    feePercentage: 2.4,
    feeFixedUSD: 0.3,
    settlementSpeed: 'T+2 Rolling',
    description: 'Tokenized global card processing with 3-D Secure 2.2 fraud prevention.',
    badge: 'Global',
    iconName: 'CreditCard',
    countries: ['Global', 'USA', 'Europe', 'UK', 'Africa'],
    apiConfig: {
      endpointUrl: 'https://api.visa.com/cybersource/v2/payments',
      environment: 'production',
      apiKeyPublic: 'visa_pub_live_4490ab',
      apiKeySecretMasked: 'visa_sec_live_8812••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/visa',
      webhookSecretMasked: 'whsec_visa_33c9••••••••••••••••',
      lastRotated: '2026-09-01 09:00 UTC',
      lastPingMs: 35,
      status: 'connected',
    },
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    phpClass: 'MastercardGateway.php',
    active: true,
    category: 'card',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CFA'],
    feePercentage: 2.4,
    feeFixedUSD: 0.3,
    settlementSpeed: 'T+2 Rolling',
    description: 'Direct acquiring network with recurrent tenant billing tokenization.',
    badge: 'Global',
    iconName: 'CreditCard',
    countries: ['Global', 'USA', 'Europe', 'UK', 'Africa'],
    apiConfig: {
      endpointUrl: 'https://api.mastercard.com/gateway/api/v1/payments',
      environment: 'production',
      apiKeyPublic: 'mc_pub_live_9921ef',
      apiKeySecretMasked: 'mc_sec_live_7714••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/mastercard',
      webhookSecretMasked: 'whsec_mc_22d5••••••••••••••••',
      lastRotated: '2026-09-01 09:00 UTC',
      lastPingMs: 38,
      status: 'connected',
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    phpClass: 'PayPalGateway.php',
    active: true,
    category: 'digital_wallet',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    feePercentage: 2.9,
    feeFixedUSD: 0.3,
    settlementSpeed: 'Instant to Balance',
    description: 'Digital wallet with buyer protection and automated monthly recurring billing.',
    badge: 'Consumer Trust',
    iconName: 'Wallet',
    countries: ['USA', 'Europe', 'UK', '200+ Markets'],
    apiConfig: {
      endpointUrl: 'https://api-m.paypal.com/v2/checkout/orders',
      environment: 'production',
      apiKeyPublic: 'paypal_client_live_8281',
      apiKeySecretMasked: 'paypal_sec_live_9941••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/paypal',
      webhookSecretMasked: 'whsec_pp_88b4••••••••••••••••',
      lastRotated: '2026-09-05 10:10 UTC',
      lastPingMs: 48,
      status: 'connected',
    },
  },
  {
    id: 'apple_pay',
    name: 'Apple Pay',
    phpClass: 'ApplePayGateway.php',
    active: true,
    category: 'digital_wallet',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    feePercentage: 2.2,
    feeFixedUSD: 0.2,
    settlementSpeed: 'T+2 Rolling',
    description: 'Frictionless biometric one-touch authentication on iOS and Safari devices.',
    badge: 'Mobile Optimized',
    iconName: 'Smartphone',
    countries: ['USA', 'Europe', 'UK'],
    apiConfig: {
      endpointUrl: 'https://apple-pay-gateway.apple.com/paymentservices/paymentSession',
      environment: 'production',
      apiKeyPublic: 'merchant.com.sunriseholdings.estate',
      apiKeySecretMasked: 'apple_cert_sec_••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/apple-pay',
      webhookSecretMasked: 'whsec_ap_11c4••••••••••••••••',
      lastRotated: '2026-08-28 15:00 UTC',
      lastPingMs: 40,
      status: 'connected',
    },
  },
  {
    id: 'google_pay',
    name: 'Google Pay',
    phpClass: 'GooglePayGateway.php',
    active: true,
    category: 'digital_wallet',
    supportedCurrencies: ['USD', 'EUR', 'GBP'],
    feePercentage: 2.2,
    feeFixedUSD: 0.2,
    settlementSpeed: 'T+2 Rolling',
    description: 'Encrypted Google Wallet tokenized payload with zero card data transmission.',
    badge: 'Android Native',
    iconName: 'Smartphone',
    countries: ['USA', 'Europe', 'UK'],
    apiConfig: {
      endpointUrl: 'https://pay.google.com/gp/v1/merchant/authorize',
      environment: 'production',
      apiKeyPublic: 'BCR2DN4TX8XXXXXX',
      apiKeySecretMasked: 'gpay_sec_live_7719••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/google-pay',
      webhookSecretMasked: 'whsec_gp_99d1••••••••••••••••',
      lastRotated: '2026-08-28 15:00 UTC',
      lastPingMs: 42,
      status: 'connected',
    },
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer (ACH / SEPA / BACS / CEMAC)',
    phpClass: 'BankTransferGateway.php',
    active: true,
    category: 'bank_transfer',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CFA'],
    feePercentage: 0.5,
    feeFixedUSD: 1.0,
    settlementSpeed: '1–3 Business Days',
    description: 'Low-cost direct clearing: ACH (USA), SEPA (Eurozone), BACS (UK), and UBA/Ecobank (CFA).',
    badge: 'Best for Rent',
    iconName: 'Building2',
    countries: ['USA (ACH)', 'EU (SEPA)', 'UK (BACS)', 'CEMAC (RIB Direct)'],
    apiConfig: {
      endpointUrl: 'https://api.plaid.com/transfer/intent/create',
      environment: 'production',
      apiKeyPublic: 'plaid_client_live_3881',
      apiKeySecretMasked: 'plaid_sec_live_4499••••••••••••••••••••••••',
      webhookUrl: 'https://api.sunriseholdings.com/v1/webhooks/bank-transfer',
      webhookSecretMasked: 'whsec_bt_77e3••••••••••••••••',
      lastRotated: '2026-09-02 12:00 UTC',
      lastPingMs: 70,
      status: 'connected',
    },
  },
];

interface CurrencyContextType {
  activeCurrency: SupportedCurrency;
  setActiveCurrency: (currency: SupportedCurrency) => void;
  currencies: Record<SupportedCurrency, CurrencyConfig>;
  exchangeRates: Record<SupportedCurrency, number>;
  updateExchangeRate: (currency: SupportedCurrency, newRate: number) => { success: boolean; message?: string };
  settlementCurrency: SupportedCurrency;
  setSettlementCurrency: (currency: SupportedCurrency) => void;
  formatAmount: (amountInUSD: number, targetCurrency?: SupportedCurrency) => string;
  convertAmount: (amount: number, fromCurrency: SupportedCurrency, toCurrency: SupportedCurrency) => number;
  gateways: LandlordGatewayConfig[];
  toggleGateway: (id: GatewayIdentifier) => { success: boolean; message?: string };
  setAllGatewaysForCurrency: (currency: SupportedCurrency, activate: boolean) => void;
  getActivatedGatewaysForCurrency: (currency: SupportedCurrency) => LandlordGatewayConfig[];
  simulateRoutePayment: (amount: number, currency: SupportedCurrency, preferredGatewayId?: GatewayIdentifier) => PaymentRoutingResult;
  updateGatewayApiConfig: (id: GatewayIdentifier, newConfig: Partial<GatewayApiConfig>) => { success: boolean; message?: string };
  updateGatewayDetails: (id: GatewayIdentifier, details: Partial<LandlordGatewayConfig>) => { success: boolean; message?: string };
  resetGatewaysToDefault: () => void;
  rotateGatewayApiKey: (id: GatewayIdentifier) => { success: boolean; newKey?: string; message?: string };
  testGatewayApiConnection: (id: GatewayIdentifier) => Promise<{ ok: boolean; latencyMs: number; statusText: string }>;
  canEditApi: boolean;
  mesombPluginConfig: MesombPluginConfig;
  updateMesombPluginConfig: (newConfig: MesombPluginConfig) => { success: boolean; message?: string };
  resetMesombPluginConfig: () => { success: boolean; message?: string };
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeRole, showSecurityNotification, logApiAction } = useSecurity();
  const [activeCurrency, setActiveCurrency] = useState<SupportedCurrency>('USD');
  const [settlementCurrency, setSettlementCurrency] = useState<SupportedCurrency>('USD');
  const [currencies, setCurrencies] = useState<Record<SupportedCurrency, CurrencyConfig>>(CURRENCY_CONFIGS);
  
  const canEditApi = activeRole === 'super_admin' || activeRole === 'owner';

  // MeSomb Plugin Management State
  const [mesombPluginConfig, setMesombPluginConfig] = useState<MesombPluginConfig>(() => getSavedMesombPluginConfig());

  const updateMesombPluginConfig = (newConfig: MesombPluginConfig): { success: boolean; message?: string } => {
    // STRICT REQUIREMENT: MeSomb Plugin configuration is strictly restricted to Admin and Super Admin
    if (activeRole !== 'super_admin' && activeRole !== 'admin') {
      logApiAction(
        'BLOCKED_MESOMB_PLUGIN_UPDATE',
        'WC_Gateway_MeSomb.php',
        `403 Forbidden: Attempted to edit MeSomb plugin configuration without Admin/Super Admin privileges (Current Role: ${activeRole})`,
        'BLOCKED_403'
      );
      showSecurityNotification('403 Forbidden: MeSomb Plugin configuration and settings are strictly restricted to Admin and Super Admin roles.');
      return { success: false, message: 'Restricted: Only Admin and Super Admin can edit MeSomb plugin settings.' };
    }

    setMesombPluginConfig(newConfig);
    saveMesombPluginConfig(newConfig);

    // Synchronize the gateways list with updated MeSomb plugin parameters
    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === 'mesomb') {
          return {
            ...g,
            name: newConfig.checkoutTitle || g.name,
            active: newConfig.active,
            feePercentage: newConfig.feePercentage,
            feeFixedUSD: newConfig.feeFixedUSD,
            description: newConfig.checkoutDescription || g.description,
            settlementSpeed: newConfig.settlementSpeed,
            apiConfig: {
              ...(g.apiConfig || ({} as GatewayApiConfig)),
              endpointUrl: newConfig.endpointUrl,
              environment: newConfig.environment,
              applicationKey: newConfig.applicationKey,
              accessKey: newConfig.accessKey,
              apiKeyPublic: newConfig.accessKey,
              apiKeySecretMasked: `${newConfig.secretKey.slice(0, 8)}••••••••••••••••`,
              secretKeyMasked: `${newConfig.secretKey.slice(0, 8)}••••••••••••••••`,
              webhookUrl: newConfig.webhookUrl,
              webhookSecretMasked: `${newConfig.webhookSecret.slice(0, 8)}••••••••`,
              merchantId: newConfig.merchantId,
              serviceProviderCode: newConfig.serviceProviderCode,
              mesombService: newConfig.routingService,
              cameroonRegionCoverage: newConfig.regionCoverage,
            },
          };
        }
        if (g.id === 'mtn_momo') {
          return {
            ...g,
            active: newConfig.mtnEnabled,
            cameroonUssd: newConfig.mtnUssdCode,
            feePercentage: newConfig.feePercentage,
            apiConfig: {
              ...(g.apiConfig || ({} as GatewayApiConfig)),
              endpointUrl: newConfig.endpointUrl,
              environment: newConfig.environment,
              ussdCode: newConfig.mtnUssdCode,
              serviceProviderCode: newConfig.mtnServiceProviderCode,
            },
          };
        }
        if (g.id === 'orange_money') {
          return {
            ...g,
            active: newConfig.orangeEnabled,
            cameroonUssd: newConfig.orangeUssdCode,
            feePercentage: newConfig.feePercentage,
            apiConfig: {
              ...(g.apiConfig || ({} as GatewayApiConfig)),
              endpointUrl: newConfig.endpointUrl,
              environment: newConfig.environment,
              ussdCode: newConfig.orangeUssdCode,
              serviceProviderCode: newConfig.orangeServiceProviderCode,
            },
          };
        }
        return g;
      })
    );

    logApiAction('UPDATE_MESOMB_PLUGIN', 'WC_Gateway_MeSomb.php', 'Updated MeSomb plugin settings, credentials & carrier routing');
    showSecurityNotification('[Plugin Manager] MeSomb Plugin settings successfully saved and applied to live carrier routing.');
    return { success: true };
  };

  const resetMesombPluginConfig = (): { success: boolean; message?: string } => {
    if (activeRole !== 'super_admin' && activeRole !== 'admin') {
      logApiAction(
        'BLOCKED_MESOMB_PLUGIN_RESET',
        'WC_Gateway_MeSomb.php',
        `403 Forbidden: Attempted to reset MeSomb plugin settings without Admin/Super Admin privileges (Current Role: ${activeRole})`,
        'BLOCKED_403'
      );
      showSecurityNotification('403 Forbidden: MeSomb Plugin reset is strictly restricted to Admin and Super Admin roles.');
      return { success: false, message: 'Restricted: Only Admin and Super Admin can reset MeSomb plugin settings.' };
    }

    setMesombPluginConfig(DEFAULT_MESOMB_PLUGIN_CONFIG);
    saveMesombPluginConfig(DEFAULT_MESOMB_PLUGIN_CONFIG);
    logApiAction('RESET_MESOMB_PLUGIN', 'WC_Gateway_MeSomb.php', 'Restored MeSomb plugin defaults to official WooCommerce normal settings');
    showSecurityNotification('[Plugin Manager] MeSomb Plugin settings set to official WooCommerce normal presets.');
    return { success: true };
  };

  const [gateways, setGateways] = useState<LandlordGatewayConfig[]>(() => {
    const saved = localStorage.getItem('estateflow_landlord_gateways_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge: ensure all Cameroon gateways from INITIAL_LANDLORD_GATEWAYS exist
          const merged: LandlordGatewayConfig[] = [...parsed];
          for (const initG of INITIAL_LANDLORD_GATEWAYS) {
            const idx = merged.findIndex((m) => m.id === initG.id);
            if (idx === -1) {
              merged.push(initG);
            } else {
              merged[idx] = {
                ...initG,
                ...merged[idx],
                apiConfig: initG.apiConfig
                  ? {
                      ...initG.apiConfig,
                      ...(merged[idx].apiConfig || {}),
                    }
                  : merged[idx].apiConfig,
              };
            }
          }
          return merged;
        }
      } catch (e) {
        return INITIAL_LANDLORD_GATEWAYS;
      }
    }
    return INITIAL_LANDLORD_GATEWAYS;
  });

  // Persist gateways
  useEffect(() => {
    localStorage.setItem('estateflow_landlord_gateways_v3', JSON.stringify(gateways));
  }, [gateways]);

  // Current rates
  const exchangeRates = {
    USD: currencies.USD.rateAgainstUSD,
    EUR: currencies.EUR.rateAgainstUSD,
    GBP: currencies.GBP.rateAgainstUSD,
    CFA: currencies.CFA.rateAgainstUSD,
  };

  const updateExchangeRate = (currency: SupportedCurrency, newRate: number): { success: boolean; message?: string } => {
    if (!canEditApi) {
      logApiAction('BLOCKED_RATE_MUTATION', `ExchangeRate/${currency}`, 'Attempted rate update without Super Admin permissions', 'BLOCKED_403');
      showSecurityNotification(`403 Forbidden: API exchange rates can only be edited by the Super Admin dashboard.`);
      return { success: false, message: 'Only Super Admin can edit exchange rates.' };
    }
    if (newRate <= 0) return { success: false, message: 'Rate must be greater than zero.' };
    setCurrencies((prev) => ({
      ...prev,
      [currency]: {
        ...prev[currency],
        rateAgainstUSD: newRate,
      },
    }));
    logApiAction('RATE_UPDATED', `ExchangeRate/${currency}`, `Updated baseline rate to ${newRate}`);
    showSecurityNotification(`[Super Admin] Updated ${currency} exchange rate to ${newRate}.`);
    return { success: true };
  };

  // Convert an amount from one currency to another
  const convertAmount = (
    amount: number,
    fromCurrency: SupportedCurrency,
    toCurrency: SupportedCurrency
  ): number => {
    if (fromCurrency === toCurrency) return amount;
    const fromRate = exchangeRates[fromCurrency];
    const toRate = exchangeRates[toCurrency];
    const amountInUSD = amount / fromRate;
    return amountInUSD * toRate;
  };

  // Format amount (provided in base USD) into active or target currency
  const formatAmount = (amountInUSD: number, targetCurrency?: SupportedCurrency): string => {
    const target = targetCurrency || activeCurrency;
    const config = currencies[target];
    const converted = amountInUSD * config.rateAgainstUSD;

    let formattedNumber: string;
    if (config.decimals === 0) {
      formattedNumber = Math.round(converted).toLocaleString('fr-FR');
    } else {
      formattedNumber = converted.toLocaleString('en-US', {
        minimumFractionDigits: config.decimals,
        maximumFractionDigits: config.decimals,
      });
    }

    if (target === 'USD') return `$${formattedNumber}`;
    if (target === 'EUR') return `€${formattedNumber}`;
    if (target === 'GBP') return `£${formattedNumber}`;
    if (target === 'CFA') return `${formattedNumber} FCFA`;

    return `${config.symbol} ${formattedNumber}`;
  };

  // Toggle Landlord Gateway Activation
  const toggleGateway = (id: GatewayIdentifier): { success: boolean; message?: string } => {
    if (!canEditApi) {
      logApiAction('BLOCKED_GATEWAY_TOGGLE', id, 'Attempted gateway status toggle without Super Admin permissions', 'BLOCKED_403');
      showSecurityNotification(`403 Forbidden: Gateway API integration status can only be toggled by the Super Admin dashboard.`);
      return { success: false, message: 'Super Admin privileges required.' };
    }

    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const nextActive = !g.active;
          logApiAction(nextActive ? 'GATEWAY_API_ACTIVATED' : 'GATEWAY_API_DEACTIVATED', g.name, `Gateway API toggled to ${nextActive ? 'ACTIVE' : 'INACTIVE'}`);
          showSecurityNotification(`[Super Admin] ${g.name} API gateway toggled ${nextActive ? 'ON' : 'OFF'}.`);
          return { ...g, active: nextActive };
        }
        return g;
      })
    );
    return { success: true };
  };

  const setAllGatewaysForCurrency = (currency: SupportedCurrency, activate: boolean) => {
    if (!canEditApi) {
      showSecurityNotification('403 Forbidden: Only Super Admin can bulk-toggle gateway APIs.');
      return;
    }
    setGateways((prev) =>
      prev.map((g) =>
        g.supportedCurrencies.includes(currency) ? { ...g, active: activate } : g
      )
    );
    showSecurityNotification(`[Super Admin] All ${currency} gateway APIs ${activate ? 'activated' : 'deactivated'}.`);
  };

  // Filter only active gateways for a currency
  const getActivatedGatewaysForCurrency = (currency: SupportedCurrency): LandlordGatewayConfig[] => {
    return gateways.filter((g) => g.active && g.supportedCurrencies.includes(currency));
  };

  // Super Admin API Config Editor
  const updateGatewayApiConfig = (
    id: GatewayIdentifier,
    newConfig: Partial<GatewayApiConfig>
  ): { success: boolean; message?: string } => {
    if (!canEditApi) {
      logApiAction('BLOCKED_API_MUTATION', id, 'Unauthorized attempt to edit live API configuration', 'BLOCKED_403');
      showSecurityNotification('403 Forbidden: API endpoint and credential mutations are strictly restricted to the Super Admin dashboard.');
      return { success: false, message: 'Forbidden: Super Admin only.' };
    }

    let targetName: string = id;
    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          targetName = g.name;
          const updatedApiConfig: GatewayApiConfig = {
            ...(g.apiConfig || {
              endpointUrl: '',
              environment: 'production',
              apiKeyPublic: '',
              apiKeySecretMasked: '',
              webhookUrl: '',
              webhookSecretMasked: '',
              lastRotated: new Date().toISOString(),
              lastPingMs: 40,
              status: 'connected',
            }),
            ...newConfig,
          };
          return { ...g, apiConfig: updatedApiConfig };
        }
        return g;
      })
    );

    logApiAction('UPDATE_API_CONFIG', targetName, `Updated endpoint, webhook, or environment parameters`);
    showSecurityNotification(`[Super Admin] Successfully updated API configuration for ${targetName}.`);
    return { success: true };
  };

  // Super Admin Rotate API Key
  const rotateGatewayApiKey = (
    id: GatewayIdentifier
  ): { success: boolean; newKey?: string; message?: string } => {
    if (!canEditApi) {
      logApiAction('BLOCKED_KEY_ROTATION', id, 'Unauthorized attempt to rotate API credentials', 'BLOCKED_403');
      showSecurityNotification('403 Forbidden: API key rotation is restricted strictly to the Super Admin dashboard.');
      return { success: false, message: 'Forbidden: Super Admin only.' };
    }

    const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const maskedKey = `${id}_sec_live_${randomSuffix.slice(0, 4)}••••••••••••••••`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    let targetName: string = id;
    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          targetName = g.name;
          return {
            ...g,
            apiConfig: {
              ...(g.apiConfig || {
                endpointUrl: '',
                environment: 'production',
                apiKeyPublic: '',
                webhookUrl: '',
                webhookSecretMasked: '',
                lastPingMs: 40,
                status: 'connected',
              }),
              apiKeySecretMasked: maskedKey,
              lastRotated: nowStr,
            },
          };
        }
        return g;
      })
    );

    logApiAction('ROTATED_SECRET', targetName, `Rotated API secret key; HMAC-SHA256 signature token regenerated`);
    showSecurityNotification(`[Super Admin] Successfully rotated API secret key for ${targetName}.`);
    return { success: true, newKey: maskedKey };
  };

  // Test Gateway Connection
  const testGatewayApiConnection = async (
    id: GatewayIdentifier
  ): Promise<{ ok: boolean; latencyMs: number; statusText: string }> => {
    const latency = Math.floor(25 + Math.random() * 55);
    await new Promise((resolve) => setTimeout(resolve, 600));

    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === id && g.apiConfig) {
          return {
            ...g,
            apiConfig: {
              ...g.apiConfig,
              lastPingMs: latency,
              status: 'connected',
            },
          };
        }
        return g;
      })
    );

    return { ok: true, latencyMs: latency, statusText: '200 OK (Verified)' };
  };

  // Super Admin Edit Gateway Details (Fees, class, name, Cameroon settings)
  const updateGatewayDetails = (
    id: GatewayIdentifier,
    details: Partial<LandlordGatewayConfig>
  ): { success: boolean; message?: string } => {
    if (!canEditApi) {
      logApiAction('BLOCKED_GATEWAY_DETAILS_MUTATION', id, 'Unauthorized attempt to edit gateway parameters', 'BLOCKED_403');
      showSecurityNotification('403 Forbidden: Gateway settings and Cameroon provider parameters can only be edited by Super Admin.');
      return { success: false, message: 'Super Admin only.' };
    }

    let targetName: string = id;
    setGateways((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          targetName = details.name || g.name;
          const mergedApi = details.apiConfig
            ? { ...(g.apiConfig || ({} as GatewayApiConfig)), ...details.apiConfig }
            : g.apiConfig;
          return {
            ...g,
            ...details,
            apiConfig: mergedApi,
          };
        }
        return g;
      })
    );

    logApiAction('UPDATE_GATEWAY_DETAILS', targetName, `Updated gateway parameters, fee schedule, or Cameroon carrier properties`);
    showSecurityNotification(`[Super Admin] Successfully updated parameters for ${targetName}.`);
    return { success: true };
  };

  const resetGatewaysToDefault = () => {
    if (!canEditApi) {
      showSecurityNotification('403 Forbidden: Only Super Admin can reset gateway configuration.');
      return;
    }
    setGateways(INITIAL_LANDLORD_GATEWAYS);
    localStorage.setItem('estateflow_landlord_gateways_v3', JSON.stringify(INITIAL_LANDLORD_GATEWAYS));
    logApiAction('RESET_GATEWAYS', 'All Gateways', 'Reset all payment gateways to default presets');
    showSecurityNotification('[Super Admin] All payment gateways including Cameroon methods restored to default presets.');
  };

  // Simulate Payment Router
  const simulateRoutePayment = (
    amountInSelectedCurrency: number,
    currency: SupportedCurrency,
    preferredGatewayId?: GatewayIdentifier
  ): PaymentRoutingResult => {
    const available = getActivatedGatewaysForCurrency(currency);
    const trace: string[] = [];

    trace.push(`[PaymentRouter.php] Received payment intent: ${amountInSelectedCurrency.toLocaleString()} ${currency}`);
    trace.push(`[PaymentRouter.php] Querying landlord_gateway_settings for currency=${currency}...`);

    if (available.length === 0) {
      trace.push(`[PaymentRouter.php] FAILED: No activated gateway found supporting ${currency}.`);
      return {
        allowed: false,
        gateway: null,
        amount: amountInSelectedCurrency,
        currency,
        fee: 0,
        netSettlement: 0,
        settlementCurrency,
        reason: `Landlord settings: All gateways for ${currency} are currently deactivated (OFF).`,
        routeTrace: trace,
      };
    }

    let selectedGateway: LandlordGatewayConfig = available[0];
    if (preferredGatewayId) {
      const match = available.find((g) => g.id === preferredGatewayId);
      if (match) {
        selectedGateway = match;
        trace.push(`[PaymentRouter.php] User preferred gateway '${match.name}' (${match.phpClass}) is ACTIVE.`);
      } else {
        trace.push(`[PaymentRouter.php] Preferred gateway '${preferredGatewayId}' is NOT active or does not support ${currency}. Falling back to default '${selectedGateway.name}'.`);
      }
    } else {
      trace.push(`[PaymentRouter.php] Dispatched to default active gateway: ${selectedGateway.name} (${selectedGateway.phpClass}).`);
    }

    // MeSomb & Mobile Money Carrier Handshake Trace
    if (selectedGateway.id === 'mesomb' || selectedGateway.id === 'mtn_momo' || selectedGateway.id === 'orange_money') {
      trace.push(`[MeSombGateway.php] Computing cryptographic HMAC-SHA1 authorization token...`);
      trace.push(`[MeSombGateway.php] API Endpoint: https://mesomb.hachther.com/api/v1.1/payment/online/`);
      trace.push(`[MeSombGateway.php] Carrier USSD push queued: ${selectedGateway.cameroonUssd || '*126# / #150#'}`);
    }

    // FeeCalculator.php
    trace.push(`[FeeCalculator.php] Calculating fees for ${selectedGateway.name}...`);
    const feeRate = selectedGateway.feePercentage / 100;
    const fixedFeeConverted = convertAmount(selectedGateway.feeFixedUSD, 'USD', currency);
    const computedFee = amountInSelectedCurrency * feeRate + fixedFeeConverted;
    trace.push(`[FeeCalculator.php] Fee = (${selectedGateway.feePercentage}% + fixed) -> ${computedFee.toFixed(currency === 'CFA' ? 0 : 2)} ${currency}`);

    // SettlementEngine.php
    const netInCurrency = Math.max(0, amountInSelectedCurrency - computedFee);
    const netInSettlementCurrency = convertAmount(netInCurrency, currency, settlementCurrency);
    trace.push(`[SettlementEngine.php] Net settlement calculated: ${netInCurrency.toFixed(currency === 'CFA' ? 0 : 2)} ${currency}`);
    trace.push(`[SettlementEngine.php] Auto-conversion to landlord settlement account (${settlementCurrency}): ${netInSettlementCurrency.toFixed(settlementCurrency === 'CFA' ? 0 : 2)} ${settlementCurrency} (Speed: ${selectedGateway.settlementSpeed})`);

    return {
      allowed: true,
      gateway: selectedGateway,
      amount: amountInSelectedCurrency,
      currency,
      fee: computedFee,
      netSettlement: netInSettlementCurrency,
      settlementCurrency,
      routeTrace: trace,
    };
  };

  return (
    <CurrencyContext.Provider
      value={{
        activeCurrency,
        setActiveCurrency,
        currencies,
        exchangeRates,
        updateExchangeRate,
        settlementCurrency,
        setSettlementCurrency,
        formatAmount,
        convertAmount,
        gateways,
        toggleGateway,
        setAllGatewaysForCurrency,
        getActivatedGatewaysForCurrency,
        simulateRoutePayment,
        updateGatewayApiConfig,
        updateGatewayDetails,
        resetGatewaysToDefault,
        rotateGatewayApiKey,
        testGatewayApiConnection,
        canEditApi,
        mesombPluginConfig,
        updateMesombPluginConfig,
        resetMesombPluginConfig,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
