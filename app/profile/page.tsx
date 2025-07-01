"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useAuth } from "@/hooks/useAuth"

export default function ProfilePage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    avatar: "",
  })
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState("")
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  })
  const [avatarPreview, setAvatarPreview] = useState("")

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        credentials: "include",
      })
      const data = await response.json()
      setProfile(data)
      setProfileForm({
        name: data.name,
        bio: data.bio,
        location: data.location,
        website: data.website,
      })
      if (data.avatar) {
        setAvatarPreview(data.avatar)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Error fetching profile")
    }
  }

  const fetchUserPosts = async () => {
    try {
      const response = await fetch("/api/profile/posts", {
        credentials: "include",
      })
      const data = await response.json()
      setPosts(data)
    } catch (error) {
      console.error("Error fetching user posts:", error)
      toast.error("Error fetching user posts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchProfile()
      fetchUserPosts()
    }
  }, [authLoading, isAuthenticated])

  const createProfileUpdatePost = async (e: any) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append("content", newPost)

      const postResponse = await fetch("/api/posts", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (postResponse.ok) {
        toast.success("Post created successfully!")
        setNewPost("")
        fetchUserPosts()
      } else {
        toast.error("Failed to create post")
      }
    } catch (error) {
      console.error("Error creating post:", error)
      toast.error("Error creating post")
    }
  }

  const handleFileUpload = async (event: any) => {
    const file = event.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        credentials: "include",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile((prev) => ({ ...prev, avatar: data.avatar }))
        setAvatarPreview(data.avatar)
        toast.success("Avatar updated successfully!")
      } else {
        toast.error("Failed to update avatar")
      }
    } catch (error) {
      console.error("Error updating avatar:", error)
      toast.error("Error updating avatar")
    }
  }

  const handleProfileUpdate = async () => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profileForm),
      })

      if (response.ok) {
        setProfile((prev) => ({ ...prev, ...profileForm }))
        toast.success("Profile updated successfully!")
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Error updating profile")
    }
  }

  const handlePasswordUpdate = async () => {
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (response.ok) {
        toast.success("Password updated successfully!")
        setPasswordForm({ currentPassword: "", newPassword: "" })
      } else {
        toast.error("Failed to update password")
      }
    } catch (error) {
      console.error("Error updating password:", error)
      toast.error("Error updating password")
    }
  }

  if (authLoading || loading) {
    return <div>Loading...</div>
  }

  // Se não estiver autenticado, o hook useAuth já redireciona
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto mt-8">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      {/* Profile Information */}
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <img
            src={avatarPreview || profile.avatar || "/default-avatar.png"}
            alt="Avatar"
            className="w-20 h-20 rounded-full mr-4"
          />
          <div>
            <input type="file" accept="image/*" onChange={handleFileUpload} />
          </div>
        </div>
        <p>
          <strong>Name:</strong> {profile.name}
        </p>
        <p>
          <strong>Bio:</strong> {profile.bio}
        </p>
        <p>
          <strong>Location:</strong> {profile.location}
        </p>
        <p>
          <strong>Website:</strong> {profile.website}
        </p>
      </div>

      {/* Update Profile Form */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Update Profile</h2>
        <input
          type="text"
          placeholder="Name"
          className="w-full p-2 border rounded mb-2"
          value={profileForm.name}
          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
        />
        <textarea
          placeholder="Bio"
          className="w-full p-2 border rounded mb-2"
          value={profileForm.bio}
          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
        />
        <input
          type="text"
          placeholder="Location"
          className="w-full p-2 border rounded mb-2"
          value={profileForm.location}
          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
        />
        <input
          type="text"
          placeholder="Website"
          className="w-full p-2 border rounded mb-2"
          value={profileForm.website}
          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
        />
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700" onClick={handleProfileUpdate}>
          Update Profile
        </button>
      </div>

      {/* Update Password Form */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Update Password</h2>
        <input
          type="password"
          placeholder="Current Password"
          className="w-full p-2 border rounded mb-2"
          value={passwordForm.currentPassword}
          onChange={(e) =>
            setPasswordForm({
              ...passwordForm,
              currentPassword: e.target.value,
            })
          }
        />
        <input
          type="password"
          placeholder="New Password"
          className="w-full p-2 border rounded mb-2"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
        />
        <button className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700" onClick={handlePasswordUpdate}>
          Update Password
        </button>
      </div>

      {/* Create Post Form */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Create a Post</h2>
        <form onSubmit={createProfileUpdatePost}>
          <textarea
            placeholder="What's on your mind?"
            className="w-full p-2 border rounded mb-2"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <button type="submit" className="bg-green-500 text-white p-2 rounded hover:bg-green-700">
            Create Post
          </button>
        </form>
      </div>

      {/* User Posts */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Posts</h2>
        {posts.map((post) => (
          <div key={post.id} className="border rounded p-4 mb-2">
            <p>{post.content}</p>
            <p className="text-gray-500">Created at: {new Date(post.createdAt).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { ToastContainer } from "react-toastify"
