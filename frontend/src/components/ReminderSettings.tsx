import { Bell, Send } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReminderSetting, TimeOfDay } from "../services/api";
import { api } from "../services/api";

const defaults: ReminderSetting[] = [
  { timeOfDay: "morning", enabled: true, time: "09:00" },
  { timeOfDay: "afternoon", enabled: true, time: "15:00" },
  { timeOfDay: "evening", enabled: true, time: "21:00" }
];

const labels: Record<TimeOfDay, string> = {
  morning: "Manana",
  afternoon: "Tarde",
  evening: "Noche"
};

export function ReminderSettings() {
  const [settings, setSettings] = useState<ReminderSetting[]>(defaults);
  const [emailConfigured, setEmailConfigured] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.reminders().then((data) => {
      setEmailConfigured(data.emailConfigured);
      if (data.settings.length) setSettings(mergeSettings(data.settings));
    });
  }, []);

  function updateSetting(timeOfDay: TimeOfDay, patch: Partial<ReminderSetting>) {
    setSettings((current) => current.map((setting) => (setting.timeOfDay === timeOfDay ? { ...setting, ...patch } : setting)));
  }

  async function save() {
    const data = await api.saveReminders(settings);
    setSettings(mergeSettings(data.settings));
    setEmailConfigured(data.emailConfigured);
    setMessage("Recordatorios guardados.");
  }

  async function testEmail() {
    const response = await api.testReminder();
    setMessage(response.message);
  }

  return (
    <div className="panel reminders">
      <div className="section-title">
        <span>Recordatorios</span>
        <Bell size={20} />
      </div>

      {!emailConfigured && <p className="soft-warning">SMTP aun no esta configurado. Puedes guardar horarios y probar el modo dry-run.</p>}

      {settings.map((setting) => (
        <div className="reminder-row" key={setting.timeOfDay}>
          <label className="toggle">
            <input
              type="checkbox"
              checked={setting.enabled}
              onChange={(event) => updateSetting(setting.timeOfDay, { enabled: event.target.checked })}
            />
            {labels[setting.timeOfDay]}
          </label>
          <input type="time" value={setting.time} onChange={(event) => updateSetting(setting.timeOfDay, { time: event.target.value })} />
        </div>
      ))}

      <div className="button-row">
        <button className="secondary-action" type="button" onClick={testEmail}>
          <Send size={16} /> Probar correo
        </button>
        <button className="primary-action compact" type="button" onClick={save}>
          Guardar
        </button>
      </div>
      {message && <p className="status-text">{message}</p>}
    </div>
  );
}

function mergeSettings(settings: ReminderSetting[]) {
  return defaults.map((item) => settings.find((setting) => setting.timeOfDay === item.timeOfDay) ?? item);
}
