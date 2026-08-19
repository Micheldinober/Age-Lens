import { useContext } from "react";
import { PredictionContext } from "./PredictionContext";

export function usePrediction() {
  const value = useContext(PredictionContext);

  if (!value) {
    throw new Error("usePrediction must be used inside <PredictionProvider>");
  }

  return value;
}
