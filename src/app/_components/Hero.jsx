'use client';

import React from "react";
import Image from "next/image";
import { ContainerScroll } from "../../components/ui/container-scroll-animation";
import { TypeAnimation } from "react-type-animation";

function Hero() {
  return (
    <section className="bg-gray-50 dark:bg-gray-900 flex items-center flex-col">
      <div className="flex flex-col overflow-hidden w-full max-w-7xl">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-black dark:text-white text-center">
                Your pocket-sized&nbsp;
                <TypeAnimation
                  sequence={[
                    "smart,",
                    2000,
                    "fast,",
                    2000,
                    "and real-time",
                    2000,
                  ]}
                  wrapper="span"
                  speed={50}
                  repeat={Infinity}
                  className="inline text-blue-800 dark:text-blue-500 font-bold"
                />
                <br />
                <span className="text-3xl sm:text-[2.5rem] md:text-[4rem] lg:text-[6rem] text-blue-800 dark:text-blue-500 font-bold mt-1 leading-tight">
                  Expense Tracker
                </span>
              </h1>
            </>
          }
        >
          <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] flex justify-center">
            <div className="relative w-full max-w-[800px] h-full">
              <Image
                src="/screenshot.png"
                alt="hero"
                fill
                className="object-contain sm:object-cover md:object-center rounded-2xl"
                priority
                draggable={false}
              />
            </div>
          </div>
        </ContainerScroll>
      </div>
    </section>
  );
}

export default Hero;
