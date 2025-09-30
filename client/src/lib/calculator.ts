interface ROICalculationInput {
  services: number;
  ticket: number;
  noisePercent: number;
  diagnosisValue: number;
}

interface ROICalculationResult {
  diagnosticsCount: number;
  diagnosisRevenue: number;
  additionalServicesRevenue: number;
  totalAdditionalRevenue: number;
  currentRevenue: number;
  totalNewRevenue: number;
  roiPeriod: string;
}

export function calculateROI({
  services,
  ticket,
  noisePercent,
  diagnosisValue
}: ROICalculationInput): ROICalculationResult {
  // Calculate current revenue
  const currentRevenue = services * ticket;
  
  // Calculate number of diagnoses based on percentage
  const diagnosticsCount = Math.round(services * (noisePercent / 100));
  
  // Calculate revenue from diagnoses
  const diagnosisRevenue = diagnosticsCount * diagnosisValue;
  
  // Assume 90% of diagnoses lead to additional services
  const servicesConversion = 0.9;
  const additionalServiceValue = 800; // Average value of additional services
  const additionalServicesRevenue = Math.round(diagnosticsCount * servicesConversion * additionalServiceValue);
  
  // Calculate total additional revenue
  const totalAdditionalRevenue = diagnosisRevenue + additionalServicesRevenue;
  
  // Calculate total new revenue
  const totalNewRevenue = currentRevenue + totalAdditionalRevenue;
  
  // Assuming RuidCar costs around 40k-50k BRL
  const estimatedCost = 45000;
  const roiMonths = Math.ceil(estimatedCost / totalAdditionalRevenue);
  
  // Determine ROI period text
  let roiPeriod: string;
  if (roiMonths <= 1) {
    roiPeriod = '1 meses';
  } else if (roiMonths <= 3) {
    roiPeriod = '3 meses';
  } else if (roiMonths <= 6) {
    roiPeriod = '4-6 meses';
  } else if (roiMonths <= 9) {
    roiPeriod = '7-9 meses';
  } else {
    roiPeriod = '10+ meses';
  }
  
  return {
    diagnosticsCount,
    diagnosisRevenue,
    additionalServicesRevenue,
    totalAdditionalRevenue,
    currentRevenue,
    totalNewRevenue,
    roiPeriod
  };
}
