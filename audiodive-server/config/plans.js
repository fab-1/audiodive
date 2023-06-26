module.exports.plans = {
  0: {
    name: 'Basic',
    maxSecondsImport: 100 * 60,
    maxSecondsExport: 15 * 60,
    maxBytesImport: 50 * 1024 * 1024,
    maxSecondsClipDuration: 100 * 60,
    maxCustomTemplate: 1
  },
  1: {
    name: 'Premium',
    maxSecondsImport: 100 * 60,
    maxSecondsExport: 10 * 60,
    maxBytesImport: 100 * 1024 * 1024, //100MB
    maxSecondsClipDuration: 100 * 60,
    maxCustomTemplate: 10,
    monthlyPlanId: 'plan_FWQxzjXiWaGWTo'
  }
}
