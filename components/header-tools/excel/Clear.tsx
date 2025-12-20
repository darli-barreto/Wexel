import Image from "next/image";
import React from "react";

function Clear() {
  return (
    <div className="flex items-center space-x-3.5 mt-1">
      <div className="flex items-center space-x-2">
        <button>
          <Image src="/icons/ec3.svg" alt="clear" width={15} height={15} />
        </button>

        <button>
          <Image
            src="/icons/dropdown.svg"
            alt="clear dropdown"
            width={6.5}
            height={4.5}
          />
        </button>
      </div>
    </div>
  );
}

export default Clear;
