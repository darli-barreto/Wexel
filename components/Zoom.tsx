import Image from "next/image";

function Zoom() {
  return (
    <div className="flex items-center space-x-2">
      <button className="cursor-pointer" disabled>
        <Image src="/icons/ez1.svg" alt="Zoom Out" width={11} height={2} />
      </button>
      <input
        type="range"
        min="10"
        max="500"
        defaultValue="100"
        className="w-20"
        disabled
      />
      <button className="cursor-pointer" disabled>
        <Image src="/icons/ez2.svg" alt="Zoom Out" width={10} height={10} />
      </button>
      <span className="text-[13px] text-secondary">100%</span>
    </div>
  );
}

export default Zoom;
