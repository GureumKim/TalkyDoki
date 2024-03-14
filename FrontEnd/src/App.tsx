import { Global } from "@/styles/common/base";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MUIThemeProvider } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import { Fonts } from "@/styles/common/fonts";
import { dark, light } from "@/styles/common/themes";
import { muiDarkTheme, muiTheme } from "./styles/common/muiTheme";
import { useIsDark } from "./stores/displayStore";
import { useIsModalOn } from "./stores/modalStore";

// route 컴포넌트
import Intro from "@/routes/Intro";
import Menu from "./routes/Menu";
import Modal from "./components/ui/Modal";
import Main from "./routes/Main";
import SignUp from "./routes/SignUp";
import Login from "./routes/Login";
import News from "./routes/News";
import Protected from "./components/Protect/Protect";
import { useAuthStore } from "./stores/userStore";

function App() {
  const isDark = useIsDark();
  const isModalOn = useIsModalOn();
  const isLogin = useAuthStore((state) => state.isLogin);

  return (
    <ThemeProvider theme={isDark ? dark : light}>
      <MUIThemeProvider theme={isDark ? muiDarkTheme : muiTheme}>
        <Fonts />
        <Global />
        <Protected />
        {isModalOn ? <Modal /> : null}
        {isLogin ? (
          <>
            <Menu />
            <Routes>
              <Route path="/" element={<Navigate replace to="/main" />} />
              <Route path="/main" element={<Main />} />
              <Route path="/news" element={<News />} />
              <Route path="/*" element={<Navigate replace to="/main" />} />
            </Routes>
          </>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate replace to="/intro" />} />
            <Route path="/intro" element={<Intro />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/*" element={<Navigate replace to="/login" />} />
          </Routes>
        )}
      </MUIThemeProvider>
    </ThemeProvider>
  );
}

export default App;
