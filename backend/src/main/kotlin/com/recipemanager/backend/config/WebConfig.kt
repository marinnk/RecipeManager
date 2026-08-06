package com.recipemanager.backend.config

import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Configuration
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.nio.file.Paths

@Configuration
class WebConfig(
    @Value("\${app.upload.dir}") private val uploadDir: String,
) : WebMvcConfigurer {
    override fun addResourceHandlers(registry: ResourceHandlerRegistry) {
        val location =
            Paths
                .get(uploadDir)
                .toAbsolutePath()
                .normalize()
                .toUri()
                .toString()
        registry
            .addResourceHandler("/api/uploads/**")
            .addResourceLocations(location)
            .setCachePeriod(3600)
    }
}
