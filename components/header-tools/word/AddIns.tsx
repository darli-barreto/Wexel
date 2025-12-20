import React from "react";

function AddIns() {
  return (
    <div className="flex flex-col tex-center justify-center items-center w-10.5 space-y-1.5 h-full">
      <button className=" flex items-center text-center justify-center cursor-pointer">
        <img className="w-7.25 h-7.25" src="/icons/f1.png" alt="add-ins" />
      </button>
      <p className="text-[11px] font-medium text-[#7f7f7d]">Add-ins</p>
    </div>
  );
}

export default AddIns;
