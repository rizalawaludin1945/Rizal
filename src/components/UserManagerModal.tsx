import React, { useState } from 'react';
import { UserAccount, UserRole } from '../types/sfa';
import { StorageService } from '../services/storageService';
import { INDONESIA_BRANCHES } from '../data/branchData';
import {
  Users,
  UserPlus,
  Trash2,
  KeyRound,
  Shield,
  Briefcase,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  Crown,
  Building2,
  Globe2,
  CheckCircle2,
  X,
  ShieldAlert
} from 'lucide-react';

interface UserManagerModalProps {
  currentUser: UserAccount;
  onClose: () => void;
  onUserSwitched: (newUser: UserAccount) => void;
  onUsersChanged?: () => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  currentUser,
  onClose,
  onUserSwitched,
  onUsersChanged
}) => {
  const [users, setUsers] = useState<UserAccount[]>(() => StorageService.getUsers());
  const [activeTab, setActiveTab] = useState<UserRole | 'all'>('general_manager');
  const [isAddMode, setIsAddMode] = useState(false);

  // Form State for New Account
  const [newRole, setNewRole] = useState<UserRole>('branch_manager');
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newNik, setNewNik] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSecurityCode, setNewSecurityCode] = useState('');
  const [newTerritory, setNewTerritory] = useState('');
  const [newBranchId, setNewBranchId] = useState('CBG-JKT');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');
  const [newVanType, setNewVanType] = useState('Van Canvas Distribusi');
  const [newDailyTarget, setNewDailyTarget] = useState(25000000);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Switch Account Security Code verification modal
  const [pendingSwitchUser, setPendingSwitchUser] = useState<UserAccount | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [codeError, setCodeError] = useState('');

  // Delete User State
  const [deletingUser, setDeletingUser] = useState<UserAccount | null>(null);
  const [supervisorAuthCode, setSupervisorAuthCode] = useState('');
  const [authError, setAuthError] = useState('');

  const gmUsers = users.filter(u => u.role === 'general_manager');
  const bmUsers = users.filter(u => u.role === 'branch_manager');
  const spvUsers = users.filter(u => u.role === 'supervisor');
  const slsUsers = users.filter(u => u.role === 'salesman');

  const displayedUsers =
    activeTab === 'all'
      ? users
      : activeTab === 'general_manager'
      ? gmUsers
      : activeTab === 'branch_manager'
      ? bmUsers
      : activeTab === 'supervisor'
      ? spvUsers
      : slsUsers;

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newName.trim() || !newUsername.trim() || !newSecurityCode.trim()) {
      setErrorMessage('Mohon lengkapi Nama, Username, dan Security Code');
      return;
    }

    if (newSecurityCode.trim().length < 4) {
      setErrorMessage('Security Code minimal 4 digit karakter');
      return;
    }

    // Check duplicate username
    if (users.some(u => u.username.toLowerCase() === newUsername.trim().toLowerCase())) {
      setErrorMessage('Username tersebut sudah digunakan oleh akun lain');
      return;
    }

    const branchObj = INDONESIA_BRANCHES.find(b => b.id === newBranchId);

    const newUser: UserAccount = {
      id:
        newRole === 'general_manager'
          ? `USR-GM-${Math.floor(100 + Math.random() * 900)}`
          : newRole === 'branch_manager'
          ? `BM-${branchObj?.code || 'REG'}-${Math.floor(10 + Math.random() * 90)}`
          : newRole === 'supervisor'
          ? `USR-SPV-${Math.floor(100 + Math.random() * 900)}`
          : `SLS-${Math.floor(100 + Math.random() * 900)}`,
      name: newName.trim(),
      username: newUsername.trim().toLowerCase(),
      role: newRole,
      securityCode: newSecurityCode.trim(),
      phone: newPhone.trim() || '0812-0000-0000',
      nik:
        newNik.trim() ||
        (newRole === 'general_manager'
          ? `DIR-${Date.now().toString().slice(-4)}`
          : newRole === 'branch_manager'
          ? `BM-${Date.now().toString().slice(-4)}`
          : newRole === 'supervisor'
          ? `SPV-${Date.now().toString().slice(-4)}`
          : `EMP-${Date.now().toString().slice(-4)}`),
      assignedTerritory:
        newRole === 'general_manager'
          ? 'Nasional (Seluruh Kantor Cabang Indonesia)'
          : newRole === 'branch_manager'
          ? branchObj?.name || 'Kantor Cabang Distribusi'
          : newTerritory.trim() || 'Wilayah Distribusi Standar',
      branchId: newRole === 'general_manager' ? 'ALL' : newBranchId,
      branchName: newRole === 'general_manager' ? 'Pusat Nasional' : branchObj?.name,
      vehiclePlate: newRole === 'salesman' ? (newVehiclePlate.trim() || 'B 1234 SFA') : undefined,
      vanType: newRole === 'salesman' ? newVanType : undefined,
      dailyTarget: newRole === 'salesman' ? Number(newDailyTarget) : undefined,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    StorageService.addUser(newUser);
    const updated = StorageService.getUsers();
    setUsers(updated);
    onUsersChanged?.();
    setIsAddMode(false);
    setSuccessMessage(`Akun ${newUser.role.toUpperCase()} "${newUser.name}" berhasil didaftarkan!`);

    // Reset fields
    setNewName('');
    setNewUsername('');
    setNewNik('');
    setNewPhone('');
    setNewSecurityCode('');
    setNewTerritory('');
    setNewVehiclePlate('');
  };

  const canDeleteUser = currentUser.role === 'supervisor' || currentUser.role === 'general_manager';

  const handleDeleteUserClick = (userToDelete: UserAccount) => {
    if (!canDeleteUser) {
      alert('Akses Ditolak: Fitur Hapus Akun hanya dapat digunakan oleh Supervisor atau General Manager!');
      return;
    }

    if (userToDelete.id === currentUser.id) {
      alert('Tidak dapat menghapus akun yang sedang Anda gunakan saat ini.');
      return;
    }

    setDeletingUser(userToDelete);
    setSupervisorAuthCode('');
    setAuthError('');
  };

  const handleConfirmDeleteWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingUser) return;

    if (supervisorAuthCode.trim() !== currentUser.securityCode.trim()) {
      setAuthError(`Security Code ${currentUser.role === 'general_manager' ? 'General Manager' : 'Supervisor'} salah!`);
      return;
    }

    const res = StorageService.deleteUser(deletingUser.id, currentUser.role);
    if (res.success) {
      const updated = StorageService.getUsers();
      setUsers(updated);
      onUsersChanged?.();
      setSuccessMessage(`Akun ${deletingUser.name} berhasil dihapus.`);
      setDeletingUser(null);
    } else {
      setAuthError(res.message);
    }
  };

  const handleStartSwitch = (user: UserAccount) => {
    if (user.id === currentUser.id) return;
    setPendingSwitchUser(user);
    setEnteredCode('');
    setCodeError('');
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSwitchUser) return;

    if (enteredCode.trim() !== pendingSwitchUser.securityCode.trim()) {
      setCodeError('Security Code salah! Akses ditolak.');
      return;
    }

    StorageService.setCurrentUser(pendingSwitchUser);
    onUserSwitched(pendingSwitchUser);
    setPendingSwitchUser(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 shrink-0 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Manajemen Akun & Kepemimpinan Cabang</h3>
              <p className="text-[11px] text-slate-400">General Manager, Branch Managers (Kepala Cabang), SPV & Salesman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Current Active Account Bar */}
        <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">Akun Aktif Saat Ini:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-slate-900">{currentUser.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                currentUser.role === 'general_manager'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                  : currentUser.role === 'branch_manager'
                  ? 'bg-teal-100 text-teal-900 border border-teal-300'
                  : currentUser.role === 'supervisor'
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {currentUser.role.replace('_', ' ')}
              </span>
              {currentUser.branchName && (
                <span className="text-[10px] text-slate-500 font-medium hidden sm:inline">
                  • {currentUser.branchName}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">Security Code</span>
            <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-xs">
              ••••
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 text-xs border-b border-emerald-200 flex items-center justify-between">
            <span>✓ {successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-emerald-700 font-bold ml-2">✕</button>
          </div>
        )}

        {/* Navigation Tabs (4 Tiers) */}
        <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex gap-1 overflow-x-auto text-[11px] font-bold p-1 bg-white rounded-xl border border-slate-200 flex-1 no-scrollbar">
            <button
              onClick={() => { setActiveTab('general_manager'); setIsAddMode(false); }}
              className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'general_manager' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>General Manager ({gmUsers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('branch_manager'); setIsAddMode(false); }}
              className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'branch_manager' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Branch Manager ({bmUsers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('supervisor'); setIsAddMode(false); }}
              className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'supervisor' ? 'bg-purple-700 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Supervisor ({spvUsers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('salesman'); setIsAddMode(false); }}
              className={`py-1.5 px-2.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1 ${
                activeTab === 'salesman' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Salesman ({slsUsers.length})</span>
            </button>

            <button
              onClick={() => { setActiveTab('all'); setIsAddMode(false); }}
              className={`py-1.5 px-2 rounded-lg whitespace-nowrap transition-all ${
                activeTab === 'all' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Semua ({users.length})
            </button>
          </div>

          <button
            onClick={() => {
              setIsAddMode(!isAddMode);
              if (activeTab !== 'all') {
                setNewRole(activeTab);
              }
            }}
            className="py-1.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isAddMode ? 'Tutup Form' : '+ Tambah Akun'}</span>
          </button>
        </div>

        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Add User Form */}
          {isAddMode && (
            <form onSubmit={handleCreateUser} className="bg-slate-50 p-4 rounded-2xl border-2 border-blue-200 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>Daftarkan Akun Pengguna Baru</span>
                </h4>
                <span className="text-[10px] text-slate-500">* Wajib diisi</span>
              </div>

              {errorMessage && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Role Selector */}
              <div>
                <label className="text-[10px] font-bold text-slate-700 block mb-1">Pilih Peran / Level Akun *</label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['general_manager', 'branch_manager', 'supervisor', 'salesman'] as UserRole[]).map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold transition-all text-center capitalize ${
                        newRole === r
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Branch Selector if Branch Manager */}
              {newRole === 'branch_manager' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Pilih Kantor Cabang Indonesia *</label>
                  <select
                    value={newBranchId}
                    onChange={(e) => setNewBranchId(e.target.value)}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {INDONESIA_BRANCHES.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Nama Lengkap & Gelar *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Contoh: Rian Anggara, SE"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: sales.rian"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Security Code (PIN / Password) *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      maxLength={8}
                      value={newSecurityCode}
                      onChange={(e) => setNewSecurityCode(e.target.value)}
                      placeholder="Min. 4 digit (misal: 1234)"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white pr-7 font-mono font-bold"
                    />
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">NIK / No. Karyawan</label>
                  <input
                    type="text"
                    value={newNik}
                    onChange={(e) => setNewNik(e.target.value)}
                    placeholder="EMP-2024-XXXX"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">No. WhatsApp / HP</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-1">Wilayah / Teritori Penugasan</label>
                  <input
                    type="text"
                    value={newTerritory}
                    onChange={(e) => setNewTerritory(e.target.value)}
                    placeholder="Misal: Jakarta Selatan / Surabaya Barat"
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {newRole === 'salesman' && (
                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-slate-200">
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Plat Nomor Kendaraan</label>
                    <input
                      type="text"
                      value={newVehiclePlate}
                      onChange={(e) => setNewVehiclePlate(e.target.value)}
                      placeholder="Contoh: B 9921 SFA"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-700 block mb-1">Target Harian (Rp)</label>
                    <input
                      type="number"
                      value={newDailyTarget}
                      onChange={(e) => setNewDailyTarget(Number(e.target.value))}
                      placeholder="25000000"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMode(false)}
                  className="w-1/3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors"
                >
                  Simpan Akun Baru
                </button>
              </div>
            </form>
          )}

          {/* Account Cards */}
          <div className="space-y-2.5">
            {displayedUsers.map(user => {
              const isCurrent = user.id === currentUser.id;

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                          user.role === 'general_manager'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : user.role === 'branch_manager'
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : user.role === 'supervisor'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user.role === 'general_manager' && <Crown className="w-3 h-3 text-amber-700" />}
                          {user.role === 'branch_manager' && <Building2 className="w-3 h-3 text-teal-700" />}
                          {user.role.replace('_', ' ')}
                        </span>

                        <span className="font-mono text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                          {user.nik}
                        </span>

                        {isCurrent && (
                          <span className="bg-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            Sedang Digunakan
                          </span>
                        )}
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-sm">{user.name}</h4>
                      <p className="text-xs text-slate-500 font-mono">@{user.username}</p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-600 pt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {user.assignedTerritory}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {user.phone}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleStartSwitch(user)}
                          className="py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                        >
                          <Unlock className="w-3 h-3 text-blue-400" />
                          <span>Ganti Akun</span>
                        </button>
                      )}

                      {/* Delete button: only if supervisor or general manager */}
                      {canDeleteUser && !isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleDeleteUserClick(user)}
                          className="p-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                          title="Hapus Akun Pengguna"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Security Code Verification Modal for Account Switching */}
        {pendingSwitchUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">Verifikasi Security Code</h4>
                    <p className="text-[10px] text-slate-500">Konfirmasi pergantian akun</p>
                  </div>
                </div>
                <button
                  onClick={() => setPendingSwitchUser(null)}
                  className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1">
                <p className="text-slate-500">Beralih ke Akun:</p>
                <p className="font-extrabold text-slate-900 text-sm">{pendingSwitchUser.name}</p>
                <p className="text-[11px] text-blue-700 font-semibold">{pendingSwitchUser.role.toUpperCase()}</p>
                <p className="text-[10px] text-slate-400">PIN Bawaan Akun: <code className="font-mono font-bold text-slate-700">{pendingSwitchUser.securityCode}</code></p>
              </div>

              {codeError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{codeError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmSwitch} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Masukkan Security Code / PIN ({pendingSwitchUser.name})
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    maxLength={8}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value)}
                    placeholder="Masukkan 4 digit PIN..."
                    className="w-full p-2.5 text-center text-lg font-mono font-black tracking-widest rounded-xl border-2 border-slate-300 focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingSwitchUser(null)}
                    className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md transition-colors"
                  >
                    Konfirmasi Masuk
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal with Security Code */}
        {deletingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3">
            <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-rose-700 uppercase tracking-wide">
                    Otorisasi Hapus Akun
                  </h4>
                  <p className="text-[10px] text-slate-500">Tindakan ini permanen</p>
                </div>
              </div>

              <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs space-y-1">
                <span className="text-[10px] text-rose-600 font-bold uppercase">Akun yang akan dihapus:</span>
                <p className="font-extrabold text-slate-900">{deletingUser.name}</p>
                <p className="text-[11px] text-slate-600">Peran: {deletingUser.role.toUpperCase()}</p>
              </div>

              {authError && (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleConfirmDeleteWithCode} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Masukkan PIN Anda ({currentUser.name})
                  </label>
                  <input
                    type="password"
                    required
                    autoFocus
                    maxLength={8}
                    value={supervisorAuthCode}
                    onChange={(e) => setSupervisorAuthCode(e.target.value)}
                    placeholder="PIN Anda untuk konfirmasi..."
                    className="w-full p-2.5 text-center text-lg font-mono font-black tracking-widest rounded-xl border-2 border-rose-300 focus:border-rose-600 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingUser(null)}
                    className="w-1/2 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="w-1/2 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md transition-colors"
                  >
                    Ya, Hapus Akun
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
