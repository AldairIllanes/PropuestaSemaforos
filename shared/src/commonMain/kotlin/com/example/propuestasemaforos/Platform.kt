package com.example.propuestasemaforos

interface Platform {
    val name: String
}

expect fun getPlatform(): Platform