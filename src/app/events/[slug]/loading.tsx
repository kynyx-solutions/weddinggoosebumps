import Loader from "@/components/Loader";

// The site loader also when moving within Events (list → post, post → post): the root
// app/loading.tsx only covers navigations that change the top-level section
export default function Loading() {
  return <Loader />;
}
