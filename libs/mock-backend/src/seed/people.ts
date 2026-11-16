/*
 * Invented NPST staff names used across the sample data. They are not the
 * portal's mock users: those come from the RBAC mock and sign in to the portal.
 */
export const SALES_MANAGER = 'Arjun Mehta';
export const SALES_TEAM = [
  'Rahul Kulkarni',
  'Sneha Patil',
  'Kavya Reddy',
  'Imran Shaikh',
] as const;
export const SOLUTIONS_TEAM = [
  'Vikram Rao',
  'Ananya Iyer',
  'Rohan Deshmukh',
] as const;
export const PROJECT_MANAGERS = [
  'Priya Sharma',
  'Aditya Joshi',
  'Meera Nair',
  'Siddharth Gupta',
  'Rajiv Bansal',
  'Shalini Kapoor',
  'Deepak Choudhary',
  'Neelam Arora',
] as const;
export const ENGINEERS = [
  'Nikhil Verma',
  'Pooja Bhatt',
  'Farhan Qureshi',
  'Divya Menon',
  'Harsh Agarwal',
  'Ishita Banerjee',
  'Tanvi Kapoor',
  'Manoj Pillai',
  'Sanjay Kulkarni',
  'Aisha Khan',
] as const;
export const HR_TEAM = ['Ritu Saxena', 'Neha Joshi'] as const;

export const FIRST_NAMES = [
  'Aarav',
  'Aditi',
  'Akash',
  'Amit',
  'Anjali',
  'Ankit',
  'Arnav',
  'Bhavna',
  'Chetan',
  'Deepa',
  'Dev',
  'Esha',
  'Gaurav',
  'Gita',
  'Hemant',
  'Isha',
  'Jatin',
  'Jyoti',
  'Kiran',
  'Kunal',
  'Lakshmi',
  'Mahesh',
  'Mansi',
  'Mohit',
  'Nandini',
  'Naveen',
  'Nisha',
  'Omkar',
  'Pallavi',
  'Pranav',
  'Rachna',
  'Rajesh',
  'Rekha',
  'Rohit',
  'Sachin',
  'Sakshi',
  'Sameer',
  'Shreya',
  'Suresh',
  'Swati',
  'Tarun',
  'Uma',
  'Varun',
  'Vidya',
  'Vinay',
  'Yash',
  'Zoya',
  'Abhishek',
  'Kritika',
  'Prateek',
] as const;

export const LAST_NAMES = [
  'Agarwal',
  'Bhosale',
  'Chatterjee',
  'Das',
  'Deshpande',
  'Gokhale',
  'Hegde',
  'Iyer',
  'Jain',
  'Kamath',
  'Khanna',
  'Kulkarni',
  'Mishra',
  'Nair',
  'Pandey',
  'Patel',
  'Pawar',
  'Rao',
  'Reddy',
  'Saxena',
  'Sen',
  'Shah',
  'Shetty',
  'Singh',
  'Sinha',
  'Thakur',
  'Trivedi',
  'Varma',
  'Wagh',
  'Yadav',
] as const;

/** firstname.lastname@<domain>, lower case. */
export function emailFor(name: string, domain: string): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z ]/g, '')
    .trim()
    .replace(/\s+/g, '.')}@${domain}`;
}
