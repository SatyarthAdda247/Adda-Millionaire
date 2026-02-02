pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'docker-central.adda247.com'
        IMAGE_NAME = 'api-partners'
    }
    
    stages {
        stage('Build') {
            steps {
                script {
                    def buildNumber = "${env.BUILD_NUMBER}"
                    def timestamp = sh(script: 'date +%Y-%m-%d-%H-%M', returnStdout: true).trim()
                    def tag = "${timestamp}-${env.BRANCH_NAME ?: 'main'}"
                    
                    env.IMAGE_TAG = tag
                    
                    sh """
                        docker buildx create --use --name mybuilder || true
                        docker buildx inspect --bootstrap
                        docker buildx build --platform linux/amd64,linux/arm64 \
                            -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:${tag} \
                            --push \
                            -f ./Dockerfile .
                    """
                }
            }
        }
        
        stage('Deploy to PROD') {
            options {
                timeout(time: 30, unit: 'MINUTES')  // Increased from 5 to 30 minutes
            }
            steps {
                input message: 'Deploy to Production?', ok: 'Deploy'
                
                script {
                    sh """
                        # Deployment steps here
                        echo "Deploying ${IMAGE_NAME}:${env.IMAGE_TAG} to production"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo "Build and deployment completed successfully"
        }
        failure {
            echo "Build or deployment failed"
        }
        aborted {
            echo "Build or deployment was aborted"
        }
    }
}
