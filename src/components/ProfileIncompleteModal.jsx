import { useApp } from '../context/AppContext';
import { Button, Icons, Modal } from '../ui';

/* First-run prompt asking reviewers to finish their profile (required before reviewing). */
export default function ProfileIncompleteModal({ onComplete }) {
  const { user } = useApp();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <Modal
      title="Complete your profile"
      subtitle={`Hi ${firstName}! Clients see your profile alongside your review comments, so it takes about two minutes to set up.`}
      icon={<Icons.Users size={18} />}
      size="sm"
      dismissible={false}
      footer={(
        <Button variant="primary" block onClick={onComplete} data-autofocus>
          Complete profile <Icons.ChevronRight size={16} />
        </Button>
      )}
    >
      <ol className="steps-list">
        <li><span className="steps-num">1</span>Add your designation and a short bio</li>
        <li><span className="steps-num">2</span>Upload your certificates and credentials</li>
      </ol>
    </Modal>
  );
}
