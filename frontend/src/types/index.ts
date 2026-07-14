export interface Festival {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  start_date: string;
  end_date: string;
  source_name: string;
  url?: string;
  image_url?: string;
  // Backward compatibility properties for UI convenience
  dates?: string;
  image?: string;
  raw?: any;
}

export type FestivalItem = Festival;
