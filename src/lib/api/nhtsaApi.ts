type VpicResponse<T> = {
    Count: number;
    Message: string;
    SearchCriteria: string | null;
    Results: T[];
};

type MakeResult = {
    Make_ID: number;
    Make_Name: string;
};

type VehicleTypeMakeResult = {
    MakeId: number;
    MakeName: string;
    VehicleTypeId: number;
    VehicleTypeName: string;
};

type ModelResult = {
    Make_ID?: number;
    Make_Name?: string;
    Model_ID?: number;
    Model_Name: string;
};

type DecodeVinResult = {
    Make?: string;
    Model?: string;
    ModelYear?: string;
    BodyClass?: string;
    VehicleType?: string;
    Trim?: string;
    Series?: string;
    ErrorCode?: string;
    ErrorText?: string;
};

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

/*
  These are the vehicle categories most relevant to an auto detailing business:
  - Passenger Car
  - Multipurpose Passenger Vehicle (SUVs, crossovers, many vans)
  - Truck
*/
const DETAILING_VEHICLE_TYPES = [
    'Passenger Car',
    'Multipurpose Passenger Vehicle',
    'Truck'
];

export const nhtsaApi = {
    async getAllMakes(): Promise<MakeResult[]> {
        const response = await fetch(`${VPIC_BASE_URL}/GetAllMakes?format=json`);

        if (!response.ok) {
            throw new Error(`Failed to fetch makes: ${response.status}`);
        }

        const data: VpicResponse<MakeResult> = await response.json();
        return data.Results;
    },

    async getMakesForVehicleType(vehicleType: string): Promise<VehicleTypeMakeResult[]> {
        const response = await fetch(
            `${VPIC_BASE_URL}/GetMakesForVehicleType/${encodeURIComponent(vehicleType)}?format=json`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch makes for vehicle type "${vehicleType}": ${response.status}`
            );
        }

        const data: VpicResponse<VehicleTypeMakeResult> = await response.json();
        return data.Results;
    },

    async getModelsForMake(make: string): Promise<ModelResult[]> {
        const response = await fetch(
            `${VPIC_BASE_URL}/GetModelsForMake/${encodeURIComponent(make)}?format=json`
        );

        if (!response.ok) {
            throw new Error(`Failed to fetch models for make "${make}": ${response.status}`);
        }

        const data: VpicResponse<ModelResult> = await response.json();
        return data.Results;
    },

    async getModelsForMakeYear(make: string, year: string | number): Promise<ModelResult[]> {
        const response = await fetch(
            `${VPIC_BASE_URL}/GetModelsForMakeYear/make/${encodeURIComponent(make)}/modelyear/${encodeURIComponent(String(year))}?format=json`
        );

        if (!response.ok) {
            throw new Error(
                `Failed to fetch models for make "${make}" and year "${year}": ${response.status}`
            );
        }

        const data: VpicResponse<ModelResult> = await response.json();
        return data.Results;
    },

    async decodeVin(vin: string, modelYear?: string | number): Promise<DecodeVinResult | null> {
        const params = new URLSearchParams({ format: 'json' });

        if (modelYear) {
            params.set('modelyear', String(modelYear));
        }

        const response = await fetch(
            `${VPIC_BASE_URL}/DecodeVinValuesExtended/${encodeURIComponent(vin)}?${params.toString()}`
        );

        if (!response.ok) {
            throw new Error(`Failed to decode VIN: ${response.status}`);
        }

        const data: VpicResponse<DecodeVinResult> = await response.json();
        return data.Results[0] ?? null;
    },

    async getMakeOptions(): Promise<string[]> {
        const makeMap = new Map<number, string>();

        for (const vehicleType of DETAILING_VEHICLE_TYPES) {
            const results = await this.getMakesForVehicleType(vehicleType);

            for (const make of results) {
                makeMap.set(make.MakeId, make.MakeName);
            }
        }

        return Array.from(makeMap.values()).sort((a, b) => a.localeCompare(b));
    },

    async getModelOptions(make: string, year: string | number): Promise<string[]> {
        const models = await this.getModelsForMakeYear(make, year);

        return [...new Set(models.map((model) => model.Model_Name))].sort((a, b) =>
            a.localeCompare(b)
        );
    }
};