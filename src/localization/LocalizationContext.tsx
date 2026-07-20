import { createContext, useContext, type ReactNode } from "react";
import { createLocalizationService, type LocalizationService } from "./LocalizationService";

const LocalizationContext = createContext<LocalizationService>(
  createLocalizationService({ preference: "en" })
);

export function LocalizationProvider({
  service,
  children
}: {
  service: LocalizationService;
  children: ReactNode;
}) {
  return (
    <LocalizationContext.Provider value={service}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization(): LocalizationService {
  return useContext(LocalizationContext);
}
