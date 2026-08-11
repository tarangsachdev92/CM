declare module "react-lottie" {
 import * as React from "react";
 interface Options {
   loop?: boolean;
   autoplay?: boolean;
   animationData: any;
   rendererSettings?: {
     preserveAspectRatio?: string;
   };
 }
 interface LottieProps {
   options: Options;
   height?: number | string;
   width?: number | string;
   isStopped?: boolean;
   isPaused?: boolean;
   speed?: number;
 }
 export default class Lottie extends React.Component<LottieProps> {}
}