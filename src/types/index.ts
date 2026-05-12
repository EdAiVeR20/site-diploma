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
  phoneNumber?: string;
  balance: number;
  verificationStatus: VerificationStatus;
  hasActiveRental: boolean;
  createdAt: string;
}

export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

// Car types
export interface Tariff {
  id: string;
  name: string;
  type: "minute" | "hourly" | "daily";
  pricePerUnit: number;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  fuelLevel: number;
  fuelType?: string;
  latitude: number;
  longitude: number;
  imageUrl?: string;
  tariffs: Tariff[];
}

export interface CarDetailsResponse {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
  year: number;
  color: string;
  vin: string;
  transmission: string;
  driveType: string;
  enginePower: number;
  fuelType: string;
  lastServiceDate: string;
  lastServiceMileage: number;
  mileage: number;
  imageUrl: string;
}

// Rental types
export interface Rental {
  id: string;
  car: Pick<Car, "id" | "brand" | "model" | "imageUrl">;
  tariff: Pick<Tariff, "name" | "type" | "pricePerUnit">;
  status: RentalStatus;
  startTime: string;
  endTime?: string;
  duration?: number;
  totalCost?: number;
}

export type RentalStatus = "pending" | "active" | "completed" | "cancelled" | "accident";

// API Response types
export interface AuthResponse {
  userId: string;
  isVerified: boolean;
  balance: number;
  phoneNumber?: string;
  accessToken: string;
}

export interface CarsResponse {
  cars: Car[];
}

export interface RentalResponse {
  rentalId: string;
  status: RentalStatus;
  car: Pick<Car, "brand" | "model"> & { licensePlate?: string };
  tariff: Pick<Tariff, "name" | "pricePerUnit">;
  startTime: string;
  durationMinutes?: number;
  estimatedCost: number;
}

export interface CurrentRentalResponse {
  rental: {
    rentalId: string;
    status: RentalStatus;
    car: { brand: string; model: string; licensePlate: string };
    tariff: { name: string; pricePerUnit: number };
    startTime: string;
    durationMinutes: number;
    estimatedCost: number;
  } | null;
}

export interface CompleteRentalResponse {
  rentalId: string;
  status: "completed";
  duration: number;
  totalCost: number;
  newBalance: number;
}

export interface RentalHistoryResponse {
  rentals: Rental[];
}

export type ProfileResponse = User;

export interface VerificationResponse {
  success: boolean;
  message: string;
  licenseData?: {
    surname?: string;
    name?: string;
    middleName?: string;
    series?: string;
    number?: string;
    issueDate?: string;
    expirationDate?: string;
  };
  passportData?: {
    surname?: string;
    name?: string;
    middleName?: string;
    series?: string;
    number?: string;
    issueDate?: string;
  };
  warnings?: string[];
}

// API Request types
export interface CreateRentalRequest {
  carId: string;
  tariffId: string;
  startTime?: string;
}

export interface CompleteRentalRequest {
  endTime?: string;
}
