import {Inter, Lusitana} from 'next/font/google';         //this will be your primary font

export const inter = Inter({subsets: ['latin']});     // Primary font

// Secondary font with weight
export const lusitana = Inter({subsets: ['latin'], weight: ['400', '700']});
