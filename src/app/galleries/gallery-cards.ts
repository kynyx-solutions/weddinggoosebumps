// The built-in albums on the Galleries page, used until albums are imported into
// Admin → Site Content → Galleries (and as the source of that import)
export interface GalleryCardData {
  image: string;
  heading: string;
  subheading: string;
  slug: string;
}

export const GALLERY_CARDS: GalleryCardData[] = [
  {
    image: "/galleries-page/headers/Tanya.jpg",
    heading: "Crafted with love ",
    subheading: "Tanya and Aayush",
    slug: "1",
  },
  {
    image: "/galleries-page/headers/Tatsav.jpg",
    heading: "Timeless modern traditions",
    subheading: "Tatsav & Vidhi",
    slug: "2",
  },
  {
    image: "/galleries-page/headers/ashish.jpg",
    heading: "Ethereal floral elegance",
    subheading: "Ashish and Juhi",
    slug: "3",
  },
  {
    image: "/galleries-page/headers/mohit.jpg",
    heading: "Culture meets joy",
    subheading: "Mohit & Hitika",
    slug: "5",
  },
  {
    image: "/galleries-page/headers/dharam.jpg",
    heading: "A majestic romance",
    subheading: "Harshil & Akanksha",
    slug: "6",
  },
  {
    image: "/galleries-page/headers/saval.jpg",
    heading: "Royal timeless luxury",
    subheading: "Dharam & Rajivi ",
    slug: "7",
  },
  {
    image: "/galleries-page/headers/mukesh.jpg",
    heading: "Love through laughter",
    subheading: "Saval & Romil ",
    slug: "8",
  },
  {
    image: "/galleries-page/headers/riya.jpg",
    heading: "Heritage in elegance",
    subheading: "Mukesh and Yamini",
    slug: "10",
  },
];
