import { useEffect, useState } from "react";
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { apiDownloadEnglishLanguageTemplate, apiGetUserSettings, apiSetLanguagePreference } from "../../api/timetable";
import { getLocalizationState, setLocalizationState, t } from "../../utils/localization";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";

const Settings = () => {
  const [settings, setSettings] = useState({ language_packs: [], english_json_example: "{}", can_manage_languages: false });
  const [mode, setMode] = useState("en");
  const [customPackId, setCustomPackId] = useState("");
  const [customJson, setCustomJson] = useState("");
  const [customName, setCustomName] = useState("");
  const [customFileName, setCustomFileName] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGetUserSettings();
        setSettings(data);
        const localState = getLocalizationState();
        setMode(localState.mode || data.language_preference?.language_mode || "en");
      } catch (error) {
        showErrorToast(error.message);
      }
    };
    load();
  }, []);

  const saveLanguage = async () => {
    try {
      const payload = {
        mode,
        language_pack_id: customPackId || null,
        custom_language_json: customJson || null,
        custom_language_name: customName || null,
        custom_language_code: "custom"
      };
      await apiSetLanguagePreference(payload);
      let customPack = null;
      if (mode === "custom" && customJson) {
        try {
          customPack = JSON.parse(customJson);
        } catch (_err) {
          customPack = null;
        }
      }
      setLocalizationState({ mode, customPack });
      showSuccessToast("Language saved");
      window.location.reload();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const downloadEnglishTemplate = async () => {
    try {
      const blob = await apiDownloadEnglishLanguageTemplate();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "english-language-template.utf16.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const onCustomFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCustomFileName(file.name);
    const text = await file.text();
    setCustomJson(text);
  };

  return (
    <Box>
      <Typography variant="h5">{t("menu.settings", "Settings")}</Typography>
      <Stack spacing={2} sx={{ mt: 2, maxWidth: 700 }}>
        <FormControl size="small">
          <InputLabel>{t("settings.language", "Language")}</InputLabel>
          <Select value={mode} label={t("settings.language", "Language")} onChange={(e) => setMode(e.target.value)}>
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="ro">Română</MenuItem>
            {settings.can_manage_languages && <MenuItem value="custom">Custom language</MenuItem>}
          </Select>
        </FormControl>

        {mode === "custom" && (
          <>
            <FormControl size="small">
              <InputLabel>Existing custom language</InputLabel>
              <Select value={customPackId} label="Existing custom language" onChange={(e) => setCustomPackId(e.target.value)}>
                <MenuItem value="">None</MenuItem>
                {settings.language_packs
                  .filter((x) => x.is_custom)
                  .map((pack) => (
                    <MenuItem key={pack.language_pack_id} value={pack.language_pack_id}>
                      {pack.display_name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {settings.can_manage_languages && (
              <>
                <Button variant="outlined" onClick={downloadEnglishTemplate}>Need English JSON example? Download file</Button>
                <TextField size="small" label="Custom language name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
                <Button variant="outlined" component="label">
                  Upload custom language JSON file
                  <input hidden type="file" accept=".json,application/json" onChange={onCustomFileUpload} />
                </Button>
                {customFileName && <Typography variant="body2">Loaded file: {customFileName}</Typography>}
              </>
            )}
            {!settings.can_manage_languages && (
              <Typography variant="body2">Only admins can create or modify custom language files. You can select an existing custom language from the list above.</Typography>
            )}
          </>
        )}

        <Button variant="contained" onClick={saveLanguage}>{t("settings.save", "Save")}</Button>
      </Stack>
    </Box>
  );
};

export default Settings;
