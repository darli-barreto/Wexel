import Header from "@/components/Header";
import TopBar from "@/components/TopBar";
import Canvaword from "@/components/Canvaword";
import Footer from "@/components/Footer";
import CanvaExcel from "@/components/CanvaExcel";

export default function Home() {
  return (
    <div className="flex flex-col bg-[#f0f0f0] h-screen">
      <TopBar />
      <Header />
      {/* <Canvaword /> */}
      <CanvaExcel />
      <Footer />
    </div>
  );
}
