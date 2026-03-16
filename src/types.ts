export interface Player {
  id: string;
  name: string;
  photoUrl?: string;
  gender: 'Male' | 'Female';
  basePrice: number;
  soldPrice?: number;
  teamId?: string;
  status: 'Available' | 'In Auction' | 'Sold' | 'Unsold';
  createdAt: any;
}

export interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  color: string;
  genderCategory: 'Male' | 'Female';
  createdAt: any;
}

export interface AuctionState {
  currentPlayerId: string | null;
  updatedAt: any;
}
