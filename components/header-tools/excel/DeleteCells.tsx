import Image from "next/image";
import React from "react";

function DeleteCells() {
  return (
    <div className="flex space-x-2">
      <button>
        <Image src="/icons/eb10.svg" alt="delete cells" width={17} height={15} />
      </button>
      <div className="flex space-x-1 items-center">
        <p className="text-[11px] text-[#7f7f7d]">Delete</p>
        <button>
          <Image
            src="/icons/dropdown.svg"
            alt="delete cells dropdown"
            width={6.5}
            height={4.5}
          />
        </button>
      </div>
    </div>
  );
}

export default DeleteCells;
