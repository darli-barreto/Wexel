import Image from "next/image";
import React from "react";

function DeleteCells() {
  return (
    <div className="flex space-x-2">
      <button className="cursor-pointer">
        <Image src="/icons/eb10.svg" alt="delete cells button" width={17} height={15} title="DeleteCells" />
      </button>
      <div className="flex space-x-1 items-center">
        <p className="text-[11px] text-[#7f7f7d]">Delete</p>
        <button className="cursor-pointer">
          <Image
            src="/icons/dropdown.svg"
            alt="delete cells dropdown"
            width={6.5}
            height={4.5}
            title="Delete Options"
          />
        </button>
      </div>
    </div>
  );
}

export default DeleteCells;
