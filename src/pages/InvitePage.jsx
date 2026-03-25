import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getInvitationByToken, acceptInvitation, declineInvitation } from '../api/invitationsApi';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Shared/Button';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { FolderIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function InvitePage() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // 'accepted' | 'declined'

  useEffect(() => {
    (async () => {
      try {
        const res = await getInvitationByToken(token);
        setInvitation(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired invitation link.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handle = async (action) => {
    if (!user) {
      navigate(`/login?redirect=/invite/${token}`);
      return;
    }
    setActing(true);
    try {
      if (action === 'accept') {
        await acceptInvitation(token);
        toast.success('You joined the project!');
        setDone('accepted');
      } else {
        await declineInvitation(token);
        setDone('declined');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong.');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-md w-full">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg mb-6">
          <FolderIcon className="w-6 h-6" />
          TaskFlow
        </div>

        {loading && <LoadingSpinner text="Loading invitation..." />}

        {error && (
          <div className="text-center">
            <XCircleIcon className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">Invitation unavailable</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={() => navigate('/projects')}>Go to Dashboard</Button>
          </div>
        )}

        {done === 'accepted' && (
          <div className="text-center">
            <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-800 font-semibold mb-1">You joined the project!</p>
            {invitation?.isLinkInvitation && (
              <p className="text-sm text-amber-600 mb-4">
                A project Admin will assign your role shortly. You won't have access until then.
              </p>
            )}
            <Button onClick={() => navigate('/projects')}>Go to Projects</Button>
          </div>
        )}

        {done === 'declined' && (
          <div className="text-center">
            <XCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-4">Invitation declined.</p>
            <Button onClick={() => navigate('/projects')}>Go to Dashboard</Button>
          </div>
        )}

        {!loading && !error && !done && invitation && (
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-sm text-gray-500 mb-1">You've been invited to join</p>
              <p className="text-xl font-bold text-gray-900">{invitation.projectName}</p>
              <p className="text-sm text-gray-500 mt-1">
                Invited by <span className="font-medium text-gray-700">{invitation.invitedByUsername}</span>
              </p>
            </div>

            {invitation.role && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                <p className="text-sm text-indigo-700">
                  You'll join as <span className="font-semibold">{invitation.role}</span>
                </p>
              </div>
            )}

            {invitation.isLinkInvitation && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-sm text-amber-700">
                  You'll join without a role. A project Admin will assign your role after you join.
                </p>
              </div>
            )}

            {!user && (
              <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                You need to be logged in to accept this invitation.
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                onClick={() => handle('decline')}
                disabled={acting || !user}
              >
                Decline
              </Button>
              <Button
                className="flex-1 justify-center"
                onClick={() => handle('accept')}
                disabled={acting || !user}
              >
                {acting ? 'Joining...' : 'Accept & Join'}
              </Button>
            </div>

            {!user && (
              <Button variant="outline" onClick={() => navigate(`/login?redirect=/invite/${token}`)}>
                Log in to accept
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
