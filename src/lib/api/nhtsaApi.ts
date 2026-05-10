// VPIC API docs: https://vpic.nhtsa.dot.gov/api/
// Safety Ratings API docs: https://api.nhtsa.gov/

type VpicResponse<T> = {
    Count: number;
    Message: string;
    SearchCriteria: string | null;
    Results: T[];
};

type SafetyRatingsResponse<T> = {
    Count: number;
    Message: string;
    Results: T[];
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
    VehicleTypeId?: number;
    VehicleTypeName?: string;
};

type SafetyRatingsModel = {
    ModelYear: number;
    Make: string;
    Model: string;
    VehicleId: number;
};

type SafetyRatingsVariant = {
    VehicleId: number;
    VehicleDescription: string;
};

export type VehicleCategory = 'van' | 'sedan' | 'coupe' | 'jeep' | 'truck' | 'suv';

const VPIC_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const API_BASE_URL = 'https://api.nhtsa.gov';

const DETAILING_VEHICLE_TYPES = [
    'Passenger Car',
    'Multipurpose Passenger Vehicle',
    'Truck'
];

function parseDescriptionToCategory(description: string): VehicleCategory | null {
    const d = ' ' + description.toUpperCase() + ' ';
    if (d.includes(' PU') || d.includes('PICKUP')) return 'truck';
    if (d.includes(' SUV ') || d.includes('SPORT UTILITY') || d.includes(' MPV ')) return 'suv';
    if (d.includes('MINIVAN') || d.includes(' VAN ')) return 'van';
    if (d.includes(' CONV ') || d.includes(' 2 DR ') || d.includes(' C ') || d.includes('COUPE') || d.includes('CONVERTIBLE')) return 'coupe';
    if (d.includes(' 4 DR ') || d.includes('SEDAN') || d.includes(' HB ')) return 'sedan';
    return null;
}

function mapVehicleTypeNameToCategory(vehicleTypeName: string): VehicleCategory {
    const vt = vehicleTypeName.toLowerCase();
    if (vt.includes('truck')) return 'truck';
    if (vt.includes('multipurpose') || vt.includes('mpv')) return 'suv';
    return 'sedan';
}

export const nhtsaApi = {
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

    async getSafetyRatingsModelsForMakeYear(year: string, make: string): Promise<SafetyRatingsModel[]> {
        const response = await fetch(
            `${API_BASE_URL}/SafetyRatings/modelyear/${encodeURIComponent(year)}/make/${encodeURIComponent(make)}?format=json`
        );

        if (!response.ok) throw new Error(`Safety ratings models fetch failed: ${response.status}`);

        const data: SafetyRatingsResponse<SafetyRatingsModel> = await response.json();
        return data.Results;
    },

    async getSafetyRatingsVariants(year: string, make: string, model: string): Promise<SafetyRatingsVariant[]> {
        const response = await fetch(
            `${API_BASE_URL}/SafetyRatings/modelyear/${encodeURIComponent(year)}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(model)}?format=json`
        );

        if (!response.ok) throw new Error(`Safety ratings variants fetch failed: ${response.status}`);

        const data: SafetyRatingsResponse<SafetyRatingsVariant> = await response.json();
        return data.Results;
    },

    async getBodyClass(make: string, model: string, year: string): Promise<VehicleCategory | null> {
        const srModels = await this.getSafetyRatingsModelsForMakeYear(year, make);
        const vpicModelLower = model.toLowerCase();

        const candidates = srModels.filter(m => {
            const srModelLower = m.Model.toLowerCase();
            return srModelLower.includes(vpicModelLower) || vpicModelLower.includes(srModelLower);
        });

        if (candidates.length === 0) return null;

        const best = candidates.sort((a, b) => a.Model.length - b.Model.length)[0];
        const variants = await this.getSafetyRatingsVariants(year, make, best.Model);

        if (variants.length === 0) return null;

        return parseDescriptionToCategory(variants[0].VehicleDescription);
    },

    async getVehicleCategory(make: string, model: string, year: string): Promise<VehicleCategory | null> {
        if (make.toUpperCase() === 'JEEP') return 'jeep';

        try {
            const category = await this.getBodyClass(make, model, year);
            if (category) return category;
        } catch {
            // fall through to VPIC fallback
        }

        try {
            const vpicModels = await this.getModelsForMakeYear(make, year);
            const match = vpicModels.find(m => m.Model_Name.toLowerCase() === model.toLowerCase());
            if (match?.VehicleTypeName) {
                return mapVehicleTypeNameToCategory(match.VehicleTypeName);
            }
        } catch {
            // give up
        }

        return null;
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