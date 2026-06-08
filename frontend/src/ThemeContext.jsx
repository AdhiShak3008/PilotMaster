import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [experimentMode, setExperimentMode] = useState(
        localStorage.getItem("pilotmaster_mode") === "exp"
    );

    useEffect(() => {
        document.documentElement.classList.toggle("experimental-mode", experimentMode);
        localStorage.setItem("pilotmaster_mode", experimentMode ? "exp" : "prod");
    }, [experimentMode]);

    const toggleMode = () => setExperimentMode(prev => !prev);

    return (
        <ThemeContext.Provider value={{ experimentMode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
