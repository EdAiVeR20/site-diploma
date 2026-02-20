// User types
export interface TelegramUser {
    id: number;
    username?: string;
    firstName: string;
    lastName?: string;
    photoUrl?: string;
    languageCode?: string;
}

export interface User {
    id: string;
    telegramId: number;
    username?: string;
    firstName: string;
    lastName?: string;
    balance: number;
    verificationStatus: VerificationStatus;
    hasActiveRental: boolean;
    createdAt: string;
}

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

// Car types
export interface Tariff {
    id: string;
    name: string;
    type: 'minute' | 'hourly' | 'daily';
    pricePerUnit: number;
}

export interface Car {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
    fuelLevel: number;
    latitude: number;
    longitude: number;
    imageUrl?: string;
    tariffs: Tariff[];
}

// Rental types
export interface Rental {
    id: string;
    car: Pick<Car, 'id' | 'brand' | 'model' | 'imageUrl'>;
    tariff: Pick<Tariff, 'name' | 'type' | 'pricePerUnit'>;
    status: RentalStatus;
    startTime: string;
    endTime?: string;
    duration?: number;
    totalCost?: number;
}

export type RentalStatus = 'pending' | 'active' | 'completed' | 'cancelled';

// API Response types
export interface AuthResponse {
    userId: string;
    isVerified: boolean;
    balance: number;
    accessToken: string;
}

export interface CarsResponse {
    cars: Car[];
}

export interface RentalResponse {
    rentalId: string;
    status: RentalStatus;
    car: Pick<Car, 'brand' | 'model'>;
    tariff: Pick<Tariff, 'name' | 'pricePerUnit'>;
    startTime: string;
    estimatedCost: number;
}

export interface CompleteRentalResponse {
    rentalId: string;
    status: 'completed';
    duration: number;
    totalCost: number;
    newBalance: number;
}

export interface RentalHistoryResponse {
    rentals: Rental[];
}

export type ProfileResponse = User;

export interface VerificationResponse {
    verificationId: string;
    status: 'pending';
    message: string;
}

// API Request types
export interface CreateRentalRequest {
    carId: string;
    tariffId: string;
    startTime?: string;
}

export interface CompleteRentalRequest {
    endLatitude: number;
    endLongitude: number;
}
