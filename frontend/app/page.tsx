import Banner from "@/components/HomeComponents/Banner";
import CategoryGrid from "@/components/Categories/CategoryGrid";
import NewThisWeekSection from "@/components/Products/NewThisWeekSection";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Banner />
      <CategoryGrid />
      <NewThisWeekSection />
    </div>
  );
}