import UserListModal from '@/components/ui/modal/UserListModal';

interface LikesModalProps {
  isOpen: boolean;
  postId: number | null;
  onClose: () => void;
}

const LikesModalProps: React.FC<LikesModalProps> = ({ isOpen, postId, onClose }) => {
  if (!postId) return null;
  return (
    <UserListModal
      isOpen={isOpen}
      onClose={onClose}
      type="likes"
      id={postId}
      title="Likes"
    />
  );
};

export default LikesModalProps;