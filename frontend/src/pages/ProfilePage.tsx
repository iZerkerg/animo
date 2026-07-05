import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { LoadingButton } from "../components/LoadingButton";
import { UserAvatar } from "../components/UserAvatar";
import { uiText } from "../constants/text";
import { api, type User } from "../services/api";
import { formatCivilDateLong, formatInstantDateLong, getCivilDateInputValue } from "../utils/date";

type Props = {
  user: User;
  onLogout: () => void;
  onUserUpdated: (user: User) => void;
};

export function ProfilePage({ onLogout, onUserUpdated, user }: Props) {
  const [name, setName] = useState(user.name);
  const [birthDate, setBirthDate] = useState(getCivilDateInputValue(user.birthDate));
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl ?? "");
  const [previewUser, setPreviewUser] = useState(user);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setPreviewUser({ ...user, name, profileImageUrl: profileImageUrl || null });
  }, [name, profileImageUrl, user]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await api.updateProfile({
        name,
        birthDate: birthDate || null,
        profileImageUrl: profileImageUrl.trim() || null
      });
      onUserUpdated(response.user);
      setMessage(uiText.profile.saved);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="profile-layout">
      <section className="panel profile-card">
        <UserAvatar size="lg" user={previewUser} />
        <div>
          <h2>{previewUser.name}</h2>
          <p>{previewUser.email}</p>
        </div>
        <dl className="profile-facts">
          <div>
            <dt>{uiText.profile.birthDate}</dt>
            <dd>{birthDate ? formatCivilDateLong(birthDate) : "Sin registrar"}</dd>
          </div>
          <div>
            <dt>{uiText.profile.createdAt}</dt>
            <dd>{formatInstantDateLong(user.createdAt)}</dd>
          </div>
        </dl>
        <button className="secondary-action logout-profile" type="button" onClick={onLogout}>
          <LogOut size={18} /> {uiText.profile.logout}
        </button>
      </section>

      <form className="panel profile-form" onSubmit={submit}>
        <div className="section-title">
          <span>{uiText.profile.title}</span>
        </div>
        <p className="status-text">{uiText.profile.subtitle}</p>
        <label>
          {uiText.auth.name}
          <input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} />
        </label>
        <label>
          {uiText.profile.imageUrl}
          <input
            placeholder={uiText.profile.imagePlaceholder}
            type="url"
            value={profileImageUrl}
            onChange={(event) => setProfileImageUrl(event.target.value)}
          />
        </label>
        <label>
          {uiText.profile.birthDate}
          <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
        </label>
        {message && <p className="success-text">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <LoadingButton className="primary-action" loading={isLoading} loadingLabel={uiText.profile.saving} type="submit">
          {uiText.profile.save}
        </LoadingButton>
      </form>
    </div>
  );
}
