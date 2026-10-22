import Image from 'next/image'
import React from 'react'

function Topografia() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
          <button
            className="flex h-10 cursor-pointer items-end justify-center outline-none focus:outline-none"
            title="Topografia"
          >
            <Image
              src="/icons/topografia-inactivo.svg"
              alt="Topografia"
              width={16}
              height={16}
              className="h-8 w-auto"
              title="Topografia"
            />
          </button>
          <p className="text-[11px] mt-1 font-medium text-[#7f7f7d]">Topografia</p>
        </div>
  )
}

export default Topografia