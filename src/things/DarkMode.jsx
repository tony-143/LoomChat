import React, { Component } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline, AppBar, Toolbar, Typography, Switch } from "@mui/material";

class DarkModeToggle extends Component {
  constructor(props) {
    super(props);
    this.state = {
      darkMode: false, // Initial state for dark mode
    };
  }

  handleThemeChange = () => {
    // Toggle darkMode state
    this.setState((prevState) => ({
      darkMode: !prevState.darkMode,
    }));
  };

  render() {
    // Create the light and dark theme
    const theme = createTheme({
      palette: {
        mode: this.state.darkMode ? "dark" : "light",
      },
    });

    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" style={{ flexGrow: 1 }}>
              {this.state.darkMode ? "Dark Mode" : "Light Mode"}
            </Typography>
            <Switch
              checked={this.state.darkMode}
              onChange={this.handleThemeChange}
              name="themeSwitch"
              color="default"
              inputProps={{ "aria-label": "toggle dark mode" }}
            />
          </Toolbar>
        </AppBar>

        {/* <div style={{ padding: "20px" }}>
          <Typography variant="h4">
            {this.state.darkMode ? "Dark Mode is On" : "Light Mode is On"}
          </Typography>
          <Typography>
            Toggle the switch to change between dark and light mode.
          </Typography>
        </div> */}
      </ThemeProvider>
    );
  }
}

export default DarkModeToggle;
