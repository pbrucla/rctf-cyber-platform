export interface Points {
  min: number;
  max: number;
}

export interface File {
  name: string;
  url: string;
}

export interface CleanedChallenge {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: Tag[];
  author: string;
  files: File[];
  points: Points;
  sortWeight?: number;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: Tag[];
  author: string;
  files: File[];
  points: Points;
  flag: string;
  tiebreakEligible: boolean;
  sortWeight?: number;
}

export interface Tag {
  name: string;
  metatag: string;
}
