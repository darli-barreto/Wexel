import React from "react";

function Toogle() {
  return (
    <label className="flex items-center gap-2 cursor-pointer px-1.5">
      <input type="checkbox" className="sr-only peer" />
      <div className="relative border border-[#aeaeae] w-6 h-3.5 bg-[#d9d9d9] peer-focus:outline-none rounded-full  peer-checked:after:translate-x-full  after:absolute after:bg-white after:border-gray-300 after:border after:shadow after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-gray-300 after:right-[12.5px]"></div>
    </label>
  );
}

export default Toogle;
