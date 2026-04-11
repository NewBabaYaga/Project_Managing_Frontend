export const ProjectRole = {
  Admin: 'Admin',
  Manager: 'Manager',
  Developer: 'Developer',
  Unassigned: 'Unassigned',
};

export const canCreateTask = (role) => role === ProjectRole.Admin || role === ProjectRole.Manager;
export const canReview = (role) => role === ProjectRole.Admin || role === ProjectRole.Manager;
export const canInviteMembers = (role) => role === ProjectRole.Admin;
export const canRemoveMembers = (role) => role === ProjectRole.Admin;
export const isDeveloper = (role) => role === ProjectRole.Developer;
export const isUnassigned = (role) => role === ProjectRole.Unassigned;
export const hasProjectAccess = (role) => role && role !== ProjectRole.Unassigned;

export const getRoleBadgeColor = (role) => {
  switch (role) {
    case ProjectRole.Admin: return 'bg-purple-100 text-purple-800';
    case ProjectRole.Manager: return 'bg-blue-100 text-blue-800';
    case ProjectRole.Developer: return 'bg-green-100 text-green-800';
    case ProjectRole.Unassigned: return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'ToDo': return 'bg-gray-100 text-gray-700';
    case 'InProgress': return 'bg-yellow-100 text-yellow-800';
    case 'Submitted': return 'bg-blue-100 text-blue-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getDifficultyColor = (difficulty) => {
  switch (difficulty) {
    case 'Easy': return 'bg-green-100 text-green-700';
    case 'Medium': return 'bg-yellow-100 text-yellow-700';
    case 'Hard': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const getDifficultyPoints = (difficulty) => {
  switch (difficulty) {
    case 'Easy': return 1;
    case 'Medium': return 3;
    case 'Hard': return 5;
    default: return 0;
  }
};
