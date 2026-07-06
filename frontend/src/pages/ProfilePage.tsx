import { Camera, LogOut, Settings } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LoadingButton } from "../components/LoadingButton";
import { UserAvatar } from "../components/UserAvatar";
import { uiText } from "../constants/text";
import { api, type User } from "../services/api";
import { formatCivilDateLong, formatInstantDateLong, getCivilDateInputValue } from "../utils/date";
import { optimizeProfileImage } from "../utils/image";

type Props = {
  user: User;
  onLogout: () => void;
  onOpenSettings: () => void;
  onUserUpdated: (user: User) => void;
};

export function ProfilePage({ onLogout, onOpenSettings, onUserUpdated, user }: Props) {
  const [name, setName] = useState(user.name);
  const [birthDate, setBirthDate] = useState(getCivilDateInputValue(user.birthDate));
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl ?? "");
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageUploadPhase, setImageUploadPhase] = useState<"idle" | "optimizing" | "uploading">("idle");
  const previewObjectUrlRef = useRef<string | null>(null);
  const isImageBusy = imageUploadPhase !== "idle";

  useEffect(() => {
    if (!editing) resetForm();
  }, [editing, user]);

  useEffect(() => {
    return () => revokePreviewObjectUrl();
  }, []);

  function resetForm() {
    revokePreviewObjectUrl();
    setName(user.name);
    setBirthDate(getCivilDateInputValue(user.birthDate));
    setProfileImageUrl(user.profileImageUrl ?? "");
  }

  function revokePreviewObjectUrl() {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
  }

  function openEditor() {
    setMessage("");
    setError("");
    resetForm();
    setEditing(true);
  }

  function cancelEditing() {
    if (isLoading || isImageBusy) return;
    setError("");
    setMessage("");
    resetForm();
    setEditing(false);
  }

  async function uploadProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || isImageBusy) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setError(uiText.profile.imageInvalid);
      return;
    }

    setError("");
    setMessage("");
    revokePreviewObjectUrl();
    setImageUploadPhase("optimizing");

    try {
      const optimizedFile = await optimizeProfileImage(file);
      const objectUrl = URL.createObjectURL(optimizedFile);
      previewObjectUrlRef.current = objectUrl;
      setProfileImageUrl(objectUrl);
      setImageUploadPhase("uploading");

      const response = await api.uploadProfileImage(optimizedFile);
      revokePreviewObjectUrl();
      setProfileImageUrl(response.profileImageUrl);
      onUserUpdated(response.user);
      setMessage(uiText.profile.imageUploaded);
    } catch (err) {
      revokePreviewObjectUrl();
      setProfileImageUrl(user.profileImageUrl ?? "");
      setError((err as Error).message);
    } finally {
      setImageUploadPhase("idle");
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (isLoading) return;

    setError("");
    setMessage("");
    setIsLoading(true);
    try {
      const response = await api.updateProfile({
        name,
        birthDate: birthDate || null
      });
      onUserUpdated(response.user);
      setMessage(uiText.profile.saved);
      setEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="profile-layout">
      <section className="panel profile-card">
        <UserAvatar size="lg" user={user} />
        <div>
          <h2>{user.name}</h2>
          <p>{user.email}</p>
        </div>
        <dl className="profile-facts">
          <div>
            <dt>{uiText.profile.birthDate}</dt>
            <dd>{user.birthDate ? formatCivilDateLong(user.birthDate) : "Sin registrar"}</dd>
          </div>
          <div>
            <dt>{uiText.profile.createdAt}</dt>
            <dd>{formatInstantDateLong(user.createdAt)}</dd>
          </div>
        </dl>
        {message && <p className="success-text">{message}</p>}
        <button className="secondary-action logout-profile" type="button" onClick={openEditor}>
          {uiText.profile.edit}
        </button>
        <button className="secondary-action logout-profile" type="button" onClick={onOpenSettings}>
          <Settings size={18} /> {uiText.profile.settings}
        </button>
        <button className="secondary-action logout-profile" type="button" onClick={onLogout}>
          <LogOut size={18} /> {uiText.profile.logout}
        </button>
      </section>

      {editing && (
        <form className="panel profile-form" onSubmit={submit}>
          <div className="section-title">
            <span>{uiText.profile.editTitle}</span>
          </div>
          <p className="status-text">{uiText.profile.subtitle}</p>
          <UserAvatar size="lg" user={{ ...user, name, profileImageUrl: profileImageUrl || null }} />
          <label className="profile-image-picker">
            <span>{user.profileImageUrl ? uiText.profile.changeImage : uiText.profile.addImage}</span>
            <input accept="image/*" disabled={isImageBusy} type="file" onChange={uploadProfileImage} />
            <span className="profile-image-action">
              <Camera size={18} />
              {imageUploadPhase === "optimizing"
                ? uiText.profile.optimizingImage
                : imageUploadPhase === "uploading"
                  ? uiText.profile.uploadingImage
                  : user.profileImageUrl
                    ? uiText.profile.changeImage
                    : uiText.profile.addImage}
            </span>
          </label>
          <label>
            {uiText.auth.name}
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={1} />
          </label>
          <label>
            {uiText.profile.birthDate}
            <input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} />
          </label>
          {error && <p className="error-text">{error}</p>}
          <div className="profile-actions">
            <button className="secondary-action" disabled={isLoading || isImageBusy} type="button" onClick={cancelEditing}>
              {uiText.profile.cancel}
            </button>
            <LoadingButton className="primary-action" loading={isLoading} loadingLabel={uiText.profile.saving} type="submit" disabled={isImageBusy}>
              {uiText.profile.save}
            </LoadingButton>
          </div>
        </form>
      )}
    </div>
  );
}
