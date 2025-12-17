

export enum RelationType {
  SELF = 'Self',
  FATHER = 'Father',
  MOTHER = 'Mother',
  GRANDFATHER = 'Grandfather',
  GRANDMOTHER = 'Grandmother',
  SPOUSE = 'Spouse',
  CHILD = 'Child',
  SIBLING = 'Sibling',
  UNCLE = 'Uncle',
  AUNT = 'Aunt',
  COUSIN = 'Cousin',
  FATHER_IN_LAW = 'Father-in-law',
  MOTHER_IN_LAW = 'Mother-in-law',
  BROTHER_IN_LAW = 'Brother-in-law',
  SISTER_IN_LAW = 'Sister-in-law',
  SON_IN_LAW = 'Son-in-law',
  DAUGHTER_IN_LAW = 'Daughter-in-law',
  // Exhaustive Additions
  BROTHER = 'Brother',
  SISTER = 'Sister',
  SON = 'Son',
  DAUGHTER = 'Daughter',
  NEPHEW = 'Nephew',
  NIECE = 'Niece',
  GRANDSON = 'Grandson',
  GRANDDAUGHTER = 'Granddaughter'
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: RelationType;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  religion?: string;
  caste?: string;
  subcaste?: string;
  gothra?: string;
  location?: string;
  avatarUrl: string;
  isMarried: boolean;
  spouseId?: string;
  parentIds: string[];
  childrenIds: string[];
  bio?: string;
  profession?: string;
  // Social
  joined: boolean;
  createdBy?: string; // ID of the user who added this member
  email?: string;
  phoneNumber?: string; // Added for notifications/identity
  // Extended details
  education?: string;
  expectations?: string;
  height?: string;
  status?: 'active' | 'suspended'; // Admin control
  role?: 'admin' | 'user'; // Access control
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export type PostCategory = 'general' | 'milestone' | 'birthday' | 'reminder' | 'invitation' | 'poll' | 'video' | 'memory';

export interface Post {
  id: string;
  authorId: string;
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  likes: number;
  comments: number;
  timestamp: string;
  type: PostCategory; // Updated type definition
  privacy: 'public' | 'extended' | 'immediate';
  pollOptions?: PollOption[];
  userVotedOptionId?: string;
  commentsList?: Comment[];
  // New Interaction Fields
  rsvpStatus?: 'attending' | 'declined' | 'pending';
  isWished?: boolean;
  // Admin Fields
  isReported?: boolean;
  reportReason?: string;
}

export interface Story {
  id: string;
  authorId: string;
  type: 'image' | 'text';
  content: string;
  color?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  timestamp: string;
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  seller: string;
  description: string;
  commission: number;
}

export interface ServiceProvider {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  rating: number;
  description: string;
  priceRange: string;
}
