type EnergyType = 'electricity' | 'water' | 'heating';

export interface MeasuringDevice {
  id: string;
  name?: string;
  energyType: EnergyType;
  consumptionRecords: ConsumptionRecord[];
}

export interface ConsumptionRecord {
  id: string;
  startDate: Date;
  endDate: Date;
  consumption: number; // Actual measured consumption for this period
}

export interface Occupant {
  id: string;
  name: string;
  squareMeters: number;
  chargedUnmeasuredShare: {
    [key in EnergyType]: boolean; // Whether the occupant should be charged for unmeasured consumption based on their square meters
  },
  measuringDevices?: MeasuringDevice[];
  magicalConstant?: number; // Specific to heating, used for distributing fixed costs
}

export interface EnergyBill {
  id: string;
  energyType: EnergyType;
  totalCost: number;
  fixedCost?: number; // Specific to heating
  startDate: Date;
  endDate: Date;
  detailedConsumption: DetailedConsumption[];
}

export interface DetailedConsumption {
  id: string;
  occupantId: string;
  startDate: Date;
  endDate: Date;
  measuredConsumption?: number; // For occupants with a measuring device for this period
  fixedCostShare?: number; // Share of the fixed cost for heating
  unmeasuredShare?: number; // Cost based on square meters
  totalCost: number; // Total calculated cost for the occupant
}

export interface Building {
  id: string;
  name: string;
  squareMeters: number;
  occupants: Occupant[];
  energyBills: EnergyBill[];
}

// Helper type for calculating and splitting bills, taking into account date ranges
export interface BillCalculationSummary {
  energyType: EnergyType;
  startDate: Date;
  endDate: Date;
  totalBillCost: number;
  fixedCost: number; // Fixed cost part of the bill, relevant for heating
  totalMeasuredConsumption: number; // Total measured consumption by occupants with devices
  totalUnmeasuredCost: number; // Total cost to be split among occupants without measured consumption
}
